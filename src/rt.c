#include "rt.h"

#include <errno.h>
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef __QNX__
#include <sys/neutrino.h>
#include <sys/siginfo.h>
#endif

uint64_t rt_now_ns(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ull + (uint64_t)ts.tv_nsec;
}

int rt_thread_start(pthread_t *th, int priority, void *(*fn)(void *), void *arg)
{
    pthread_attr_t attr;
    struct sched_param sp;
    memset(&sp, 0, sizeof sp);
    sp.sched_priority = priority;

    pthread_attr_init(&attr);
    pthread_attr_setinheritsched(&attr, PTHREAD_EXPLICIT_SCHED);
    pthread_attr_setschedpolicy(&attr, SCHED_FIFO);
    pthread_attr_setschedparam(&attr, &sp);
    int rc = pthread_create(th, &attr, fn, arg);
    pthread_attr_destroy(&attr);

    if (rc == EPERM || rc == EINVAL) {
        /* Not allowed to use real-time priority here: run as normal. */
        fprintf(stderr, "note: no real-time priority (%s), running best effort\n",
                strerror(rc));
        rc = pthread_create(th, NULL, fn, arg);
    }
    return rc;
}

#ifdef __QNX__
/* ---------------------------------------------------------------- QNX */

#define PULSE_CODE_TICK (_PULSE_CODE_MINAVAIL + 1)

struct rt_ticker {
    int chid;
    int coid;
    timer_t timer;
};

void rt_tune_clock(uint64_t period_ns)
{
    struct _clockperiod cp = { .nsec = (unsigned long)period_ns, .fract = 0 };
    if (ClockPeriod(CLOCK_REALTIME, &cp, NULL, 0) == -1) {
        fprintf(stderr, "note: could not set clock period: %s\n", strerror(errno));
    }
}

rt_ticker_t *rt_ticker_create(uint64_t period_ns)
{
    rt_ticker_t *t = calloc(1, sizeof *t);
    if (!t) return NULL;

    /* A private channel; the kernel timer sends a pulse to it each period. */
    t->chid = ChannelCreate(_NTO_CHF_PRIVATE);
    if (t->chid == -1) goto fail;
    t->coid = ConnectAttach(0, 0, t->chid, _NTO_SIDE_CHANNEL, 0);
    if (t->coid == -1) goto fail;

    struct sigevent ev;
    /* The pulse carries the receiving thread's own priority. */
    SIGEV_PULSE_INIT(&ev, t->coid, SIGEV_PULSE_PRIO_INHERIT, PULSE_CODE_TICK, 0);
    if (timer_create(CLOCK_MONOTONIC, &ev, &t->timer) == -1) goto fail;

    struct itimerspec its;
    its.it_value.tv_sec = 0;
    its.it_value.tv_nsec = (long)period_ns;
    its.it_interval = its.it_value;
    if (timer_settime(t->timer, 0, &its, NULL) == -1) goto fail;
    return t;

fail:
    perror("rt_ticker_create");
    free(t);
    return NULL;
}

int rt_ticker_wait(rt_ticker_t *t)
{
    struct _pulse pulse;
    for (;;) {
        if (MsgReceivePulse(t->chid, &pulse, sizeof pulse, NULL) == -1) return -1;
        if (pulse.code == PULSE_CODE_TICK) return 0;
    }
}

void rt_ticker_destroy(rt_ticker_t *t)
{
    if (!t) return;
    timer_delete(t->timer);
    ConnectDetach(t->coid);
    ChannelDestroy(t->chid);
    free(t);
}

#else
/* -------------------------------------------------------------- POSIX */

struct rt_ticker {
    uint64_t period_ns;
    uint64_t next_ns;
};

void rt_tune_clock(uint64_t period_ns) { (void)period_ns; }

rt_ticker_t *rt_ticker_create(uint64_t period_ns)
{
    rt_ticker_t *t = calloc(1, sizeof *t);
    if (!t) return NULL;
    t->period_ns = period_ns;
    t->next_ns = rt_now_ns() + period_ns;
    return t;
}

int rt_ticker_wait(rt_ticker_t *t)
{
    uint64_t now = rt_now_ns();
    if (t->next_ns > now) {
        uint64_t d = t->next_ns - now;
        struct timespec ts = { (time_t)(d / 1000000000ull), (long)(d % 1000000000ull) };
        while (nanosleep(&ts, &ts) == -1 && errno == EINTR) {}
    }
    t->next_ns += t->period_ns;
    /* If we fell far behind, skip ahead instead of firing in a burst. */
    now = rt_now_ns();
    if (now > t->next_ns + 10 * t->period_ns) t->next_ns = now + t->period_ns;
    return 0;
}

void rt_ticker_destroy(rt_ticker_t *t) { free(t); }

#endif
