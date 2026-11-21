/*
 * Pump simulator.
 *
 * Stands in for the real pump hardware: a motor, a flow sensor, two
 * pressure sensors and an ultrasonic air detector. It makes one sample
 * per millisecond and can inject faults on command, so the monitor can
 * be tested against the same failures a real pump sees.
 */
#ifndef INFUSAFE_PUMP_SIM_H
#define INFUSAFE_PUMP_SIM_H

#include <stdatomic.h>
#include <stdint.h>

#include "safety_rules.h"

typedef enum {
    FAULT_NONE = 0,
    FAULT_OCCLUSION,     /* line kinked or clamped below the pump */
    FAULT_FREE_FLOW,     /* cassette not seated, gravity takes over */
    FAULT_AIR,           /* a 60 uL bubble passes the detector */
    FAULT_EMPTY_BAG,     /* bag runs dry */
    FAULT_SENSOR_HANG,   /* sensor board stops sending */
    FAULT_COUNT
} fault_t;

/*
 * Shared between the sensor thread (writer) and the monitor (reader).
 * A seqlock: the writer bumps `gen` to odd, writes, bumps to even.
 * The reader retries if it saw an odd or changed `gen`. No mutex, so the
 * high priority monitor can never block behind the sensor thread.
 */
typedef struct {
    _Atomic uint32_t gen;
    pump_sample_t    sample;
} sample_slot_t;

typedef struct {
    sample_slot_t       slot;
    _Atomic int         motor_on;         /* monitor clears this to stop */
    _Atomic int         pending_fault;    /* fault_t asked for by a command */
    _Atomic uint64_t    fault_at_ns;      /* when the fault really began */
    _Atomic int         active_fault;
    _Atomic int         quit;
    double              set_rate_ml_h;
    uint64_t            seq;
    double              volume_ml;
    double              air_total_ul;     /* detector's running total */
    int                 bubble_done;
} pump_t;

void pump_init(pump_t *p, double set_rate_ml_h);

/* One sensor step. Call every 1 ms from the sensor thread. */
void pump_step(pump_t *p, uint64_t now_ns, double dt_s);

/* Copy the newest sample out without locking or waiting.
 * Returns -1 if a write was in progress; *out is then left unchanged. */
int pump_read(pump_t *p, pump_sample_t *out);

void pump_inject(pump_t *p, fault_t f);
void pump_clear(pump_t *p);

const char *fault_name(fault_t f);
fault_t fault_from_name(const char *name);

#endif
