#include "monitor.h"

#include <inttypes.h>
#include <stdatomic.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

#include "rt.h"

#define TICK_NS 1000000ull   /* 1 kHz */

void monitor_init(monitor_t *m, const drug_profile_t *drug,
                  double rate_ml_h, double volume_ml)
{
    memset(m, 0, sizeof *m);
    m->drug = drug;
    m->volume_ml = volume_ml;
    pump_init(&m->pump, rate_ml_h);
    safety_default_config(&m->cfg);
    safety_reset(&m->st, volume_ml);
    pthread_mutex_init(&m->lock, NULL);
    m->period_min_ns = UINT64_MAX;
}

void *sensor_thread(void *arg)
{
    monitor_t *m = arg;
    rt_ticker_t *t = rt_ticker_create(TICK_NS);
    if (!t) return NULL;
    uint64_t last = rt_now_ns();
    while (!atomic_load(&m->pump.quit)) {
        rt_ticker_wait(t);
        uint64_t now = rt_now_ns();
        pump_step(&m->pump, now, (double)(now - last) / 1e9);
        last = now;
    }
    rt_ticker_destroy(t);
    return NULL;
}

/*
 * The monitor only records events in memory. It never prints: writing
 * to a console can block, and a safety loop must never wait on I/O.
 * The logger thread, at low priority, prints them later.
 */
static void log_event(monitor_t *m, const event_t *e)
{
    pthread_mutex_lock(&m->lock);    /* QNX mutexes inherit priority */
    m->events[m->n_events % EVENT_LOG_LEN] = *e;
    m->n_events++;
    pthread_mutex_unlock(&m->lock);
}

void *logger_thread(void *arg)
{
    monitor_t *m = arg;
    unsigned printed = 0;
    while (!atomic_load(&m->pump.quit)) {
        struct timespec ts = { 0, 20 * 1000000L };
        nanosleep(&ts, NULL);

        event_t batch[EVENT_LOG_LEN];
        unsigned n = 0;
        pthread_mutex_lock(&m->lock);
        if (m->n_events - printed > EVENT_LOG_LEN) printed = m->n_events - EVENT_LOG_LEN;
        while (printed < m->n_events) batch[n++] = m->events[printed++ % EVENT_LOG_LEN];
        pthread_mutex_unlock(&m->lock);

        for (unsigned i = 0; i < n && !m->quiet; i++) {
            const event_t *e = &batch[i];
            if (e->latency_ns) {
                printf("[%8.3f s] %-4s %-12s fault=%-11s stopped in %.3f ms\n",
                       (double)(e->t_ns - m->start_ns) / 1e9,
                       safety_verdict_name(e->verdict), safety_reason_name(e->reason),
                       fault_name((fault_t)e->fault), (double)e->latency_ns / 1e6);
            } else {
                printf("[%8.3f s] %-4s %-12s\n",
                       (double)(e->t_ns - m->start_ns) / 1e9,
                       safety_verdict_name(e->verdict), safety_reason_name(e->reason));
            }
        }
        if (n) fflush(stdout);
    }
    return NULL;
}

void *monitor_thread(void *arg)
{
    monitor_t *m = arg;
    rt_ticker_t *t = rt_ticker_create(TICK_NS);
    if (!t) return NULL;

    m->start_ns = rt_now_ns();
    uint64_t prev = m->start_ns;
    verdict_t last_verdict = VERDICT_RUN;
    reason_t last_reason = REASON_NONE;
    pump_sample_t s;
    memset(&s, 0, sizeof s);

    while (!atomic_load(&m->pump.quit)) {
        rt_ticker_wait(t);
        uint64_t woke = rt_now_ns();

        /* Timing: how steady is our 1 ms heartbeat? */
        uint64_t period = woke - prev;
        prev = woke;
        if (m->ticks > 0) {
            if (period < m->period_min_ns) m->period_min_ns = period;
            if (period > m->period_max_ns) m->period_max_ns = period;
            m->period_sum_ns += period;
        }
        m->ticks++;

        /* A reset after a stop: start clean, motor back on. */
        if (__atomic_load_n(&m->reset_requested, __ATOMIC_ACQUIRE)) {
            __atomic_store_n(&m->reset_requested, 0, __ATOMIC_RELEASE);
            safety_reset(&m->st, m->volume_ml);
            /* Judge only samples taken after the clear, not the old one. */
            pump_read(&m->pump, &s);
            m->st.last_seq = s.seq;
            m->st.last_new_sample_ns = woke;
            last_verdict = VERDICT_RUN;
            last_reason = REASON_NONE;
            pthread_mutex_lock(&m->lock);
            m->verdict = VERDICT_RUN;
            m->reason = REASON_NONE;
            pthread_mutex_unlock(&m->lock);
        }

        /* Once stopped, stay stopped until a nurse clears it. */
        if (last_verdict == VERDICT_STOP) continue;

        /* If the sensor is mid-write, judge the last good sample. Its
         * seq does not change, so a sensor that stays busy is caught
         * by the stale check. */
        pump_read(&m->pump, &s);
        safety_result_t r = safety_evaluate(&m->cfg, &m->st, &s, woke);

        if (r.verdict == VERDICT_STOP) {
            atomic_store(&m->pump.motor_on, 0);      /* the safety action */
        }
        uint64_t done = rt_now_ns();
        if (done - woke > m->eval_max_ns) m->eval_max_ns = done - woke;

        if (r.verdict != last_verdict || r.reason != last_reason) {
            event_t e = { .t_ns = done, .verdict = r.verdict, .reason = r.reason };
            uint64_t fault_at = atomic_load(&m->pump.fault_at_ns);
            e.fault = atomic_load(&m->pump.active_fault);
            if (r.verdict != VERDICT_RUN && fault_at && done > fault_at) {
                e.latency_ns = done - fault_at;
            }
            pthread_mutex_lock(&m->lock);
            m->verdict = r.verdict;
            m->reason = r.reason;
            pthread_mutex_unlock(&m->lock);
            log_event(m, &e);
            last_verdict = r.verdict;
            last_reason = r.reason;
        }
    }
    rt_ticker_destroy(t);
    return NULL;
}

int monitor_status_json(monitor_t *m, char *buf, size_t len)
{
    pump_sample_t s;
    memset(&s, 0, sizeof s);
    while (pump_read(&m->pump, &s) != 0) {}   /* low priority: may retry */

    pthread_mutex_lock(&m->lock);
    verdict_t v = m->verdict;
    reason_t r = m->reason;
    unsigned n = m->n_events;
    event_t last = n ? m->events[(n - 1) % EVENT_LOG_LEN] : (event_t){0};
    pthread_mutex_unlock(&m->lock);

    uint64_t ticks = m->ticks > 1 ? m->ticks - 1 : 1;
    return snprintf(buf, len,
        "{\"drug\":\"%s\",\"state\":\"%s\",\"reason\":\"%s\","
        "\"motor\":%d,\"set_rate_ml_h\":%.1f,\"flow_ml_h\":%.1f,"
        "\"downstream_mmhg\":%.1f,\"upstream_mmhg\":%.1f,"
        "\"volume_ml\":%.3f,\"target_ml\":%.1f,"
        "\"tick_hz\":1000,\"ticks\":%" PRIu64 ","
        "\"period_us\":{\"min\":%.1f,\"avg\":%.1f,\"max\":%.1f},"
        "\"eval_max_us\":%.1f,\"events\":%u,"
        "\"last_stop_ms\":%.3f}\n",
        m->drug ? m->drug->name : "?",
        safety_verdict_name(v), safety_reason_name(r),
        atomic_load(&m->pump.motor_on), s.set_rate_ml_h, s.flow_ml_h,
        s.downstream_mmhg, s.upstream_mmhg, s.volume_ml, m->volume_ml,
        m->ticks,
        m->period_min_ns == UINT64_MAX ? 0.0 : (double)m->period_min_ns / 1e3,
        (double)m->period_sum_ns / (double)ticks / 1e3,
        (double)m->period_max_ns / 1e3,
        (double)m->eval_max_ns / 1e3, n,
        (double)last.latency_ns / 1e6);
}

int monitor_command(monitor_t *m, const char *line, char *reply, size_t reply_len)
{
    char verb[32] = {0}, arg[32] = {0};
    if (sscanf(line, "%31s %31s", verb, arg) < 1) {
        snprintf(reply, reply_len, "error: empty command\n");
        return -1;
    }
    if (strcmp(verb, "inject") == 0) {
        fault_t f = fault_from_name(arg);
        if (f == FAULT_COUNT || f == FAULT_NONE) {
            snprintf(reply, reply_len,
                     "error: faults are occlusion, free-flow, air, empty-bag, sensor-hang\n");
            return -1;
        }
        pump_inject(&m->pump, f);
        snprintf(reply, reply_len, "ok: injecting %s\n", fault_name(f));
        return 0;
    }
    if (strcmp(verb, "clear") == 0) {
        pump_clear(&m->pump);
        __atomic_store_n(&m->reset_requested, 1, __ATOMIC_RELEASE);
        snprintf(reply, reply_len, "ok: cleared, pump running\n");
        return 0;
    }
    if (strcmp(verb, "status") == 0) {
        monitor_status_json(m, reply, reply_len);
        return 0;
    }
    if (strcmp(verb, "quit") == 0) {
        atomic_store(&m->pump.quit, 1);
        snprintf(reply, reply_len, "ok: stopping\n");
        return 0;
    }
    snprintf(reply, reply_len, "error: commands are inject <fault>, clear, status, quit\n");
    return -1;
}
