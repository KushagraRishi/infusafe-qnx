#include "pump_sim.h"

#include <math.h>
#include <string.h>
#include <strings.h>

/* Small fast noise so the sensors look alive. xorshift32. */
static uint32_t g_rng = 0x9e3779b9u;
static double noise(double amp)
{
    g_rng ^= g_rng << 13;
    g_rng ^= g_rng >> 17;
    g_rng ^= g_rng << 5;
    return ((double)(g_rng & 0xffff) / 65535.0 - 0.5) * 2.0 * amp;
}

void pump_init(pump_t *p, double set_rate_ml_h)
{
    memset(p, 0, sizeof *p);
    p->set_rate_ml_h = set_rate_ml_h;
    atomic_store(&p->motor_on, 1);
}

void pump_inject(pump_t *p, fault_t f)
{
    atomic_store(&p->pending_fault, (int)f);
}

void pump_clear(pump_t *p)
{
    atomic_store(&p->pending_fault, (int)FAULT_NONE);
    atomic_store(&p->active_fault, (int)FAULT_NONE);
    atomic_store(&p->fault_at_ns, 0);
    atomic_store(&p->motor_on, 1);
}

static void publish(pump_t *p, const pump_sample_t *s)
{
    uint32_t g = atomic_load_explicit(&p->slot.gen, memory_order_relaxed);
    atomic_store_explicit(&p->slot.gen, g + 1, memory_order_relaxed);
    atomic_thread_fence(memory_order_release);
    p->slot.sample = *s;
    atomic_store_explicit(&p->slot.gen, g + 2, memory_order_release);
}

int pump_read(pump_t *p, pump_sample_t *out)
{
    /*
     * Never spin until the writer finishes. On one CPU the monitor
     * outranks the sensor thread, so if it preempted a half-done write,
     * waiting would freeze both forever. Try a few times, then give up
     * and let the caller keep its last good sample.
     */
    for (int tries = 0; tries < 4; tries++) {
        uint32_t g1 = atomic_load_explicit(&p->slot.gen, memory_order_acquire);
        if (g1 & 1u) continue;
        pump_sample_t tmp = p->slot.sample;
        atomic_thread_fence(memory_order_acquire);
        uint32_t g2 = atomic_load_explicit(&p->slot.gen, memory_order_relaxed);
        if (g1 == g2) {
            *out = tmp;
            return 0;
        }
    }
    return -1;
}

void pump_step(pump_t *p, uint64_t now_ns, double dt_s)
{
    int pending = atomic_exchange(&p->pending_fault, (int)FAULT_NONE);
    if (pending != FAULT_NONE) {
        p->bubble_done = 0;
        atomic_store(&p->active_fault, pending);
        atomic_store(&p->fault_at_ns, now_ns);
    }
    fault_t f = (fault_t)atomic_load(&p->active_fault);

    /* A hung sensor board publishes nothing at all. */
    if (f == FAULT_SENSOR_HANG) return;

    int motor = atomic_load(&p->motor_on);
    uint64_t since_ns = f ? now_ns - atomic_load(&p->fault_at_ns) : 0;
    double since_s = (double)since_ns / 1e9;

    pump_sample_t s;
    s.t_ns = now_ns;
    s.seq = ++p->seq;
    s.set_rate_ml_h = p->set_rate_ml_h;
    s.flow_ml_h = motor ? p->set_rate_ml_h + noise(p->set_rate_ml_h * 0.02) : 0.0;
    s.downstream_mmhg = 40.0 + noise(3.0);
    s.upstream_mmhg = 10.0 + noise(2.0);

    switch (f) {
    case FAULT_OCCLUSION:
        /* Pressure climbs as the motor keeps pushing into a closed line. */
        s.flow_ml_h = 0.0;
        if (motor) s.downstream_mmhg += 600.0 * (1.0 - exp(-since_s / 0.15));
        break;
    case FAULT_FREE_FLOW:
        /* Gravity flow: several times the set rate, motor or not. */
        s.flow_ml_h = p->set_rate_ml_h * 4.0 + noise(5.0);
        break;
    case FAULT_AIR:
        /* One 60 uL bubble reaches the detector 2 ms after the fault starts. */
        if (since_ns >= 2000000ull && !p->bubble_done) {
            p->air_total_ul += 60.0;
            p->bubble_done = 1;
        }
        break;
    case FAULT_EMPTY_BAG:
        s.upstream_mmhg = -180.0 + noise(5.0);
        s.flow_ml_h *= 0.3;
        break;
    default:
        break;
    }

    p->volume_ml += s.flow_ml_h * dt_s / 3600.0;
    s.volume_ml = p->volume_ml;
    s.air_total_ul = p->air_total_ul;
    publish(p, &s);
}

static const char *k_fault_names[FAULT_COUNT] = {
    "none", "occlusion", "free-flow", "air", "empty-bag", "sensor-hang",
};

const char *fault_name(fault_t f)
{
    return (f >= 0 && f < FAULT_COUNT) ? k_fault_names[f] : "unknown";
}

fault_t fault_from_name(const char *name)
{
    for (int i = 0; i < FAULT_COUNT; i++) {
        if (strcasecmp(name, k_fault_names[i]) == 0) return (fault_t)i;
    }
    return FAULT_COUNT;
}
