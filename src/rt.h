/*
 * Thin real-time layer. On QNX it uses native timer pulses and
 * priorities. Elsewhere it falls back to plain POSIX so the logic can
 * still be run and tested on a laptop.
 */
#ifndef INFUSAFE_RT_H
#define INFUSAFE_RT_H

#include <pthread.h>
#include <stdint.h>

uint64_t rt_now_ns(void);

typedef struct rt_ticker rt_ticker_t;

/* A ticker wakes its owner thread every period_ns. */
rt_ticker_t *rt_ticker_create(uint64_t period_ns);
int  rt_ticker_wait(rt_ticker_t *t);   /* blocks until the next tick */
void rt_ticker_destroy(rt_ticker_t *t);

/* Start a thread at a fixed real-time priority (SCHED_FIFO). */
int rt_thread_start(pthread_t *th, int priority, void *(*fn)(void *), void *arg);

/* Ask the kernel for a finer system tick, when the OS allows it. */
void rt_tune_clock(uint64_t period_ns);

#endif
