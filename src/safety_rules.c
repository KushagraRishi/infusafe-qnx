#include "safety_rules.h"

#include <string.h>

#define NS_PER_S 1000000000ull

void safety_default_config(safety_config_t *cfg)
{
    cfg->free_flow_ratio        = 1.25;
    cfg->free_flow_hold_ns      = 50ull * 1000000ull;   /* 50 ms */
    cfg->occlusion_rise_mmhg    = 300.0;
    cfg->occlusion_slope_mmhg_s = 2000.0;
    cfg->slope_window_ns        = 15ull * 1000000ull;   /* 15 ms */
    cfg->bubble_max_ul          = 50.0;
    cfg->air_window_max_ul      = 100.0;
    cfg->air_window_ns          = 15ull * 60ull * NS_PER_S; /* 15 min */
    cfg->empty_bag_mmhg         = -100.0;
    cfg->stale_ns               = 5ull * 1000000ull;    /* 5 ms */
    cfg->baseline_alpha         = 0.001;
}

void safety_reset(safety_state_t *st, double target_volume_ml)
{
    memset(st, 0, sizeof *st);
    st->target_volume_ml = target_volume_ml;
}

static void air_push(safety_state_t *st, uint64_t t_ns, double ul)
{
    unsigned cap = sizeof st->air / sizeof st->air[0];
    if (st->air_len == cap) {               /* full: drop the oldest */
        st->air_total_ul -= st->air[st->air_head].ul;
        st->air_head = (st->air_head + 1) % cap;
        st->air_len--;
    }
    unsigned tail = (st->air_head + st->air_len) % cap;
    st->air[tail].t_ns = t_ns;
    st->air[tail].ul = ul;
    st->air_len++;
    st->air_total_ul += ul;
}

static void air_expire(safety_state_t *st, uint64_t now_ns, uint64_t window_ns)
{
    unsigned cap = sizeof st->air / sizeof st->air[0];
    while (st->air_len > 0) {
        uint64_t t = st->air[st->air_head].t_ns;
        if (now_ns >= t && now_ns - t <= window_ns) break;
        st->air_total_ul -= st->air[st->air_head].ul;
        st->air_head = (st->air_head + 1) % cap;
        st->air_len--;
    }
    if (st->air_len == 0) st->air_total_ul = 0.0;
}

/*
 * Push the new pressure into the ring, then return the rise per second
 * between now and the oldest point inside the window. Over 15 ms the
 * sensor noise averages out, so only a real climb looks steep.
 */
static double pressure_slope(safety_state_t *st, const pump_sample_t *s,
                             uint64_t window_ns)
{
    unsigned cap = sizeof st->press / sizeof st->press[0];
    if (st->press_len == cap) {
        st->press_head = (st->press_head + 1) % cap;
        st->press_len--;
    }
    unsigned tail = (st->press_head + st->press_len) % cap;
    st->press[tail].t_ns = s->t_ns;
    st->press[tail].mmhg = s->downstream_mmhg;
    st->press_len++;

    /* Drop points older than the window, but keep at least one. */
    while (st->press_len > 1 &&
           s->t_ns - st->press[st->press_head].t_ns > window_ns) {
        st->press_head = (st->press_head + 1) % cap;
        st->press_len--;
    }
    uint64_t t0 = st->press[st->press_head].t_ns;
    if (s->t_ns <= t0 || s->t_ns - t0 < window_ns / 2) return 0.0;
    double dt = (double)(s->t_ns - t0) / (double)NS_PER_S;
    return (s->downstream_mmhg - st->press[st->press_head].mmhg) / dt;
}

safety_result_t safety_evaluate(const safety_config_t *cfg,
                                safety_state_t *st,
                                const pump_sample_t *s,
                                uint64_t now_ns)
{
    safety_result_t r = { VERDICT_RUN, REASON_NONE };
    int fresh = (s->seq != st->last_seq) || st->last_new_sample_ns == 0;

    /* 1. Sensor watchdog. No fresh sample in time means we are blind. */
    if (fresh) {
        st->last_new_sample_ns = now_ns;
    } else if (now_ns - st->last_new_sample_ns > cfg->stale_ns) {
        r.verdict = VERDICT_STOP;
        r.reason = REASON_SENSOR_STALE;
        return r;
    }
    if (!fresh) return r;   /* nothing new to judge */

    /* 2. Air in line: one big bubble, or too much air over time. */
    if (s->air_ul > 0.0) {
        if (s->air_ul >= cfg->bubble_max_ul) {
            r.verdict = VERDICT_STOP;
            r.reason = REASON_AIR_BUBBLE;
        }
        air_push(st, s->t_ns, s->air_ul);
    }
    air_expire(st, s->t_ns, cfg->air_window_ns);
    if (r.verdict != VERDICT_STOP && st->air_total_ul >= cfg->air_window_max_ul) {
        r.verdict = VERDICT_STOP;
        r.reason = REASON_AIR_TOTAL;
    }

    /* 3. Downstream occlusion: pressure far above baseline, or a sharp rise. */
    if (r.verdict != VERDICT_STOP) {
        if (!st->have_baseline) {
            st->baseline_mmhg = s->downstream_mmhg;
            st->have_baseline = 1;
        }
        double slope = pressure_slope(st, s, cfg->slope_window_ns);
        if (s->downstream_mmhg - st->baseline_mmhg >= cfg->occlusion_rise_mmhg ||
            slope >= cfg->occlusion_slope_mmhg_s) {
            r.verdict = VERDICT_STOP;
            r.reason = REASON_OCCLUSION;
        } else {
            /* Only learn the baseline while things look normal. */
            st->baseline_mmhg += cfg->baseline_alpha *
                                 (s->downstream_mmhg - st->baseline_mmhg);
        }
    }

    /* 4. Free flow: measured flow well above the programmed rate. */
    if (r.verdict != VERDICT_STOP) {
        if (s->flow_ml_h > s->set_rate_ml_h * cfg->free_flow_ratio) {
            if (st->over_flow_since_ns == 0) st->over_flow_since_ns = s->t_ns;
            if (s->t_ns - st->over_flow_since_ns >= cfg->free_flow_hold_ns) {
                r.verdict = VERDICT_STOP;
                r.reason = REASON_FREE_FLOW;
            }
        } else {
            st->over_flow_since_ns = 0;
        }
    }

    /* 5. Dose complete. */
    if (r.verdict != VERDICT_STOP && st->target_volume_ml > 0.0 &&
        s->volume_ml >= st->target_volume_ml) {
        r.verdict = VERDICT_STOP;
        r.reason = REASON_DOSE_DONE;
    }

    /* 6. Empty bag is a warning: no harm yet, but a nurse should come. */
    if (r.verdict == VERDICT_RUN && s->upstream_mmhg <= cfg->empty_bag_mmhg) {
        r.verdict = VERDICT_WARN;
        r.reason = REASON_EMPTY_BAG;
    }

    st->last_seq = s->seq;
    return r;
}

const char *safety_reason_name(reason_t r)
{
    static const char *names[REASON_COUNT] = {
        "none", "free-flow", "occlusion", "air-bubble", "air-total",
        "empty-bag", "sensor-stale", "dose-done",
    };
    return (r >= 0 && r < REASON_COUNT) ? names[r] : "unknown";
}

const char *safety_verdict_name(verdict_t v)
{
    switch (v) {
    case VERDICT_RUN:  return "RUN";
    case VERDICT_WARN: return "WARN";
    case VERDICT_STOP: return "STOP";
    }
    return "?";
}
