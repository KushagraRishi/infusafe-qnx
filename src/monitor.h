/*
 * The safety monitor: shared state between the monitor thread, the
 * sensor thread and the control interface.
 */
#ifndef INFUSAFE_MONITOR_H
#define INFUSAFE_MONITOR_H

#include <pthread.h>
#include <stdint.h>

#include "drug_library.h"
#include "pump_sim.h"
#include "safety_rules.h"

#define EVENT_LOG_LEN 32

typedef struct {
    uint64_t   t_ns;
    int        fault;          /* fault_t that was injected, if any */
    reason_t   reason;
    verdict_t  verdict;
    uint64_t   latency_ns;     /* fault start -> motor stopped */
} event_t;

typedef struct {
    pump_t           pump;
    safety_config_t  cfg;
    safety_state_t   st;
    const drug_profile_t *drug;
    double           volume_ml;

    pthread_mutex_t  lock;     /* guards everything below, never taken by the monitor in its hot path */
    verdict_t        verdict;
    reason_t         reason;
    event_t          events[EVENT_LOG_LEN];
    unsigned         n_events;
    int              reset_requested;

    /* timing stats, written only by the monitor thread */
    uint64_t ticks;
    uint64_t period_min_ns, period_max_ns, period_sum_ns;
    uint64_t eval_max_ns;
    uint64_t start_ns;
} monitor_t;

void monitor_init(monitor_t *m, const drug_profile_t *drug,
                  double rate_ml_h, double volume_ml);
void *monitor_thread(void *arg);
void *sensor_thread(void *arg);

/* Commands: "inject <fault>", "clear", "status". Returns 0 if handled. */
int monitor_command(monitor_t *m, const char *line, char *reply, size_t reply_len);

/* One status report as JSON. */
int monitor_status_json(monitor_t *m, char *buf, size_t len);

/* Start the control interface: /dev/infusafe on QNX, stdin elsewhere. */
int control_start(monitor_t *m);

#endif
