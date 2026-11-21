/*
 * InfuSafe: a real-time safety monitor for infusion pumps, on QNX.
 *
 *   infusafe [-d drug] [-r rate_ml_h] [-v volume_ml] [-y] [-b runs] [-t seconds]
 *
 *   -d  drug profile (saline, chemo-a, chemo-b, antiemetic, pain-opioid)
 *   -r  programmed rate in mL/h
 *   -v  volume to deliver in mL
 *   -y  confirm a rate that is over the soft limit
 *   -b  bench mode: inject every fault this many times and report how
 *       fast the monitor stopped the pump each time
 *   -t  stop after this many seconds (0 = run until "quit")
 *   -l  list drug profiles
 */
#include <getopt.h>
#include <inttypes.h>
#include <stdatomic.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#include "monitor.h"
#include "rt.h"

#define PRIO_MONITOR 50
#define PRIO_SENSOR  40

static void sleep_ms(unsigned ms)
{
    struct timespec ts = { ms / 1000, (long)(ms % 1000) * 1000000L };
    nanosleep(&ts, NULL);
}

static void list_drugs(void)
{
    printf("%-12s %10s %10s %10s\n", "drug", "soft mL/h", "hard mL/h", "max mL");
    for (size_t i = 0; i < drug_count(); i++) {
        const drug_profile_t *d = drug_at(i);
        printf("%-12s %10.1f %10.1f %10.1f\n", d->name, d->soft_max_rate_ml_h,
               d->hard_max_rate_ml_h, d->max_volume_ml);
    }
}

/* Wait until the monitor reaches STOP, or give up after timeout_ms. */
static int wait_for_stop(monitor_t *m, unsigned timeout_ms, event_t *out)
{
    unsigned before;
    pthread_mutex_lock(&m->lock);
    before = m->n_events;
    pthread_mutex_unlock(&m->lock);

    for (unsigned waited = 0; waited < timeout_ms; waited++) {
        sleep_ms(1);
        pthread_mutex_lock(&m->lock);
        for (unsigned i = before; i < m->n_events; i++) {
            event_t e = m->events[i % EVENT_LOG_LEN];
            if (e.verdict != VERDICT_RUN) {
                *out = e;
                pthread_mutex_unlock(&m->lock);
                return 0;
            }
        }
        pthread_mutex_unlock(&m->lock);
    }
    return -1;
}

static void bench(monitor_t *m, int runs)
{
    static const fault_t faults[] = {
        FAULT_OCCLUSION, FAULT_FREE_FLOW, FAULT_AIR, FAULT_SENSOR_HANG, FAULT_EMPTY_BAG,
    };
    const int nf = (int)(sizeof faults / sizeof faults[0]);

    printf("\nbench: %d runs per fault, monitor at 1 kHz\n\n", runs);
    sleep_ms(300);   /* let the pressure baseline settle */

    printf("%-12s %-12s %6s %6s %9s %9s %9s\n",
           "fault", "caught as", "runs", "missed", "min ms", "avg ms", "max ms");
    for (int fi = 0; fi < nf; fi++) {
        double mn = 1e9, mx = 0, sum = 0;
        int ok = 0, missed = 0;
        reason_t seen = REASON_NONE;
        for (int r = 0; r < runs; r++) {
            char reply[64];
            snprintf(reply, sizeof reply, "inject %s", fault_name(faults[fi]));
            char out[256];
            /* Start each run from a clean, running pump. */
            monitor_command(m, "clear", out, sizeof out);
            sleep_ms(30);
            monitor_command(m, reply, out, sizeof out);
            event_t e;
            if (wait_for_stop(m, 1000, &e) == 0 && e.latency_ns) {
                double ms = (double)e.latency_ns / 1e6;
                if (ms < mn) mn = ms;
                if (ms > mx) mx = ms;
                sum += ms;
                ok++;
                seen = e.reason;
            } else {
                missed++;
            }
            monitor_command(m, "clear", out, sizeof out);
            sleep_ms(250);   /* back to normal before the next run */
        }
        printf("%-12s %-12s %6d %6d %9.3f %9.3f %9.3f\n",
               fault_name(faults[fi]), safety_reason_name(seen), runs, missed,
               ok ? mn : 0.0, ok ? sum / ok : 0.0, ok ? mx : 0.0);
        fflush(stdout);
    }

    char status[2048];
    monitor_status_json(m, status, sizeof status);
    printf("\nstatus: %s", status);
}

int main(int argc, char **argv)
{
    const char *drug_name = "chemo-a";
    double rate = 50.0, volume = 200.0;
    int confirm = 0, bench_runs = 0, seconds = 0, opt;

    setvbuf(stdout, NULL, _IOLBF, 0);

    while ((opt = getopt(argc, argv, "d:r:v:yb:t:lh")) != -1) {
        switch (opt) {
        case 'd': drug_name = optarg; break;
        case 'r': rate = atof(optarg); break;
        case 'v': volume = atof(optarg); break;
        case 'y': confirm = 1; break;
        case 'b': bench_runs = atoi(optarg); break;
        case 't': seconds = atoi(optarg); break;
        case 'l': list_drugs(); return 0;
        default:
            fprintf(stderr,
                "usage: %s [-d drug] [-r mL/h] [-v mL] [-y] [-b runs] [-t s] [-l]\n",
                argv[0]);
            return opt == 'h' ? 0 : 2;
        }
    }

    /* Step 1: check the nurse's program against the drug library. */
    const drug_profile_t *drug = drug_find(drug_name);
    const char *why;
    program_check_t pc = drug_check_program(drug, rate, volume, &why);
    printf("program: %s at %.1f mL/h, %.1f mL -> %s\n",
           drug_name, rate, volume, why);
    if (pc == PROGRAM_REJECTED) return 1;
    if (pc == PROGRAM_NEEDS_CONFIRM && !confirm) {
        printf("program: not started. Run again with -y to confirm.\n");
        return 1;
    }

    /* Step 2: start the sensor and the monitor at real-time priority. */
    rt_tune_clock(100000);   /* 100 us system tick, for a steady 1 kHz */

    static monitor_t mon;
    monitor_init(&mon, drug, rate, volume);

    pthread_t th_sensor, th_monitor;
    if (rt_thread_start(&th_sensor, PRIO_SENSOR, sensor_thread, &mon) != 0 ||
        rt_thread_start(&th_monitor, PRIO_MONITOR, monitor_thread, &mon) != 0) {
        perror("thread start");
        return 1;
    }
    printf("monitor: running at 1 kHz (monitor prio %d, sensor prio %d)\n",
           PRIO_MONITOR, PRIO_SENSOR);

    if (bench_runs > 0) {
        bench(&mon, bench_runs);
        atomic_store(&mon.pump.quit, 1);
    } else {
        if (control_start(&mon) != 0) return 1;
        uint64_t end = seconds > 0 ? rt_now_ns() + (uint64_t)seconds * 1000000000ull : 0;
        while (!atomic_load(&mon.pump.quit)) {
            sleep_ms(100);
            if (end && rt_now_ns() >= end) atomic_store(&mon.pump.quit, 1);
        }
    }

    pthread_join(th_monitor, NULL);
    pthread_join(th_sensor, NULL);
    return 0;
}
