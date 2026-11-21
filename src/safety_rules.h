/*
 * InfuSafe safety rules.
 *
 * Pure logic, no OS calls, so the same code runs in the QNX monitor
 * and in the unit tests on any computer.
 *
 * The monitor calls safety_evaluate() once per tick with the newest
 * sensor sample. It returns what the pump must do right now.
 */
#ifndef INFUSAFE_SAFETY_RULES_H
#define INFUSAFE_SAFETY_RULES_H

#include <stdint.h>

typedef struct {
    uint64_t t_ns;               /* when the sample was taken */
    uint64_t seq;                /* goes up by one per sample */
    double   set_rate_ml_h;      /* what the nurse programmed */
    double   flow_ml_h;          /* what the flow sensor measures */
    double   downstream_mmhg;    /* line pressure toward the patient */
    double   upstream_mmhg;      /* line pressure toward the bag */
    double   air_total_ul;       /* all air the detector has ever seen, microlitres.
                                    A running total, so a bubble is never lost
                                    even if the monitor misses a sample. */
    double   volume_ml;          /* total delivered so far */
} pump_sample_t;

typedef struct {
    double free_flow_ratio;        /* flow above set_rate * this is too fast */
    uint64_t free_flow_hold_ns;    /* ...for at least this long */
    double occlusion_rise_mmhg;    /* pressure this far over baseline = blocked */
    double occlusion_slope_mmhg_s; /* or rising this fast... */
    uint64_t slope_window_ns;      /* ...measured over this window */
    double bubble_max_ul;          /* one bubble this big stops the pump */
    double air_window_max_ul;      /* total air allowed inside the window */
    uint64_t air_window_ns;
    double empty_bag_mmhg;         /* upstream pressure below this = empty bag */
    uint64_t stale_ns;             /* no new sample for this long = sensor fault */
    double baseline_alpha;         /* how fast the pressure baseline follows */
} safety_config_t;

typedef enum {
    VERDICT_RUN = 0,
    VERDICT_WARN,                /* sound an alarm, keep running */
    VERDICT_STOP                 /* stop the motor now */
} verdict_t;

typedef enum {
    REASON_NONE = 0,
    REASON_FREE_FLOW,
    REASON_OCCLUSION,
    REASON_AIR_BUBBLE,
    REASON_AIR_TOTAL,
    REASON_EMPTY_BAG,
    REASON_SENSOR_STALE,
    REASON_DOSE_DONE,
    REASON_COUNT
} reason_t;

typedef struct {
    double   baseline_mmhg;
    int      have_baseline;
    /* recent pressures, to measure the rise over a short window */
    struct { uint64_t t_ns; double mmhg; } press[32];
    unsigned press_head, press_len;
    uint64_t last_seq;
    uint64_t last_new_sample_ns;
    uint64_t over_flow_since_ns;  /* 0 when flow is fine */
    /* ring of recent bubbles for the rolling air total */
    struct { uint64_t t_ns; double ul; } air[64];
    unsigned air_head, air_len;
    double   air_total_ul;
    double   target_volume_ml;
    double   air_ref_ul;         /* detector total at our last look */
    int      have_air_ref;
} safety_state_t;

typedef struct {
    verdict_t verdict;
    reason_t  reason;
} safety_result_t;

void safety_default_config(safety_config_t *cfg);
void safety_reset(safety_state_t *st, double target_volume_ml);

/* now_ns is the monitor's own clock, used to spot a stale sensor. */
safety_result_t safety_evaluate(const safety_config_t *cfg,
                                safety_state_t *st,
                                const pump_sample_t *s,
                                uint64_t now_ns);

const char *safety_reason_name(reason_t r);
const char *safety_verdict_name(verdict_t v);

#endif
