/*
 * Unit tests for the safety rules and drug library.
 * Plain C, no framework: each check prints PASS or FAIL.
 */
#include <stdio.h>
#include <string.h>

#include "../src/drug_library.h"
#include "../src/safety_rules.h"

static int g_fail, g_pass;

#define CHECK(cond, name) do { \
    if (cond) { g_pass++; } \
    else { g_fail++; printf("FAIL %s (line %d)\n", name, __LINE__); } \
} while (0)

#define MS 1000000ull

static pump_sample_t normal(uint64_t seq)
{
    pump_sample_t s;
    memset(&s, 0, sizeof s);
    s.seq = seq;
    s.t_ns = seq * MS;
    s.set_rate_ml_h = 50.0;
    s.flow_ml_h = 50.0;
    s.downstream_mmhg = 40.0 + (seq % 3);   /* a little wobble */
    s.upstream_mmhg = 10.0;
    s.volume_ml = 0.01 * (double)seq;
    return s;
}

/* Feed n normal samples. Returns the last result. */
static safety_result_t warm_up(const safety_config_t *c, safety_state_t *st,
                               uint64_t *seq, int n)
{
    safety_result_t r = {0};
    for (int i = 0; i < n; i++) {
        pump_sample_t s = normal(++*seq);
        r = safety_evaluate(c, st, &s, s.t_ns);
    }
    return r;
}

static void test_normal_runs(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    safety_result_t r = warm_up(&c, &st, &seq, 2000);
    CHECK(r.verdict == VERDICT_RUN, "normal flow keeps running");
}

static void test_occlusion(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    warm_up(&c, &st, &seq, 500);
    int stopped_at = -1;
    for (int i = 0; i < 200; i++) {
        pump_sample_t s = normal(++seq);
        s.downstream_mmhg += 10.0 * i;      /* 10 mmHg per ms = 10000 mmHg/s */
        safety_result_t r = safety_evaluate(&c, &st, &s, s.t_ns);
        if (r.verdict == VERDICT_STOP) {
            CHECK(r.reason == REASON_OCCLUSION, "occlusion reason");
            stopped_at = i;
            break;
        }
    }
    CHECK(stopped_at >= 0 && stopped_at <= 20, "occlusion caught within 20 ms");
}

static void test_noise_is_not_occlusion(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    int false_stop = 0;
    for (int i = 0; i < 5000; i++) {
        pump_sample_t s = normal(++seq);
        s.downstream_mmhg = 40.0 + ((i * 7919) % 7) - 3.0;   /* +-3 mmHg jitter */
        if (safety_evaluate(&c, &st, &s, s.t_ns).verdict == VERDICT_STOP) false_stop = 1;
    }
    CHECK(!false_stop, "sensor noise does not trip occlusion");
}

static void test_free_flow_needs_hold_time(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    warm_up(&c, &st, &seq, 100);

    /* A 10 ms spike is not free flow. */
    for (int i = 0; i < 10; i++) {
        pump_sample_t s = normal(++seq);
        s.flow_ml_h = 200.0;
        CHECK(safety_evaluate(&c, &st, &s, s.t_ns).verdict == VERDICT_RUN,
              "short flow spike tolerated");
    }
    warm_up(&c, &st, &seq, 10);

    int stopped_at = -1;
    for (int i = 0; i < 200; i++) {
        pump_sample_t s = normal(++seq);
        s.flow_ml_h = 200.0;
        safety_result_t r = safety_evaluate(&c, &st, &s, s.t_ns);
        if (r.verdict == VERDICT_STOP) {
            CHECK(r.reason == REASON_FREE_FLOW, "free-flow reason");
            stopped_at = i;
            break;
        }
    }
    CHECK(stopped_at >= 49 && stopped_at <= 52, "free flow stops after 50 ms");
}

static void test_air(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    warm_up(&c, &st, &seq, 10);

    pump_sample_t s = normal(++seq);
    s.air_ul = 60.0;
    safety_result_t r = safety_evaluate(&c, &st, &s, s.t_ns);
    CHECK(r.verdict == VERDICT_STOP && r.reason == REASON_AIR_BUBBLE,
          "one big bubble stops at once");

    /* Many small bubbles add up. */
    safety_reset(&st, 1000.0);
    seq = 0;
    r.verdict = VERDICT_RUN;
    int n = 0;
    while (r.verdict == VERDICT_RUN && n < 100) {
        s = normal(++seq);
        s.air_ul = 10.0;
        r = safety_evaluate(&c, &st, &s, s.t_ns);
        n++;
    }
    CHECK(r.reason == REASON_AIR_TOTAL && n == 10, "ten 10 uL bubbles add to 100 uL");
}

static void test_stale_sensor(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 1000.0);
    uint64_t seq = 0;
    warm_up(&c, &st, &seq, 10);
    pump_sample_t s = normal(seq);           /* same seq: nothing new */
    uint64_t now = s.t_ns;
    safety_result_t r = { VERDICT_RUN, REASON_NONE };
    int ms = 0;
    while (r.verdict == VERDICT_RUN && ms < 50) {
        now += MS;
        ms++;
        r = safety_evaluate(&c, &st, &s, now);
    }
    CHECK(r.reason == REASON_SENSOR_STALE && ms == 6, "stale sensor stops after 5 ms");
}

static void test_dose_done_and_empty_bag(void)
{
    safety_config_t c; safety_default_config(&c);
    safety_state_t st; safety_reset(&st, 5.0);
    uint64_t seq = 0;
    pump_sample_t s = normal(++seq);
    s.volume_ml = 5.0;
    safety_result_t r = safety_evaluate(&c, &st, &s, s.t_ns);
    CHECK(r.verdict == VERDICT_STOP && r.reason == REASON_DOSE_DONE, "stops at target volume");

    safety_reset(&st, 1000.0);
    s = normal(++seq);
    s.upstream_mmhg = -150.0;
    r = safety_evaluate(&c, &st, &s, s.t_ns);
    CHECK(r.verdict == VERDICT_WARN && r.reason == REASON_EMPTY_BAG, "empty bag warns");
}

static void test_drug_library(void)
{
    const char *why;
    const drug_profile_t *d = drug_find("chemo-a");
    CHECK(d != NULL, "chemo-a exists");
    CHECK(drug_check_program(d, 50, 200, &why) == PROGRAM_OK, "normal program ok");
    CHECK(drug_check_program(d, 80, 200, &why) == PROGRAM_NEEDS_CONFIRM, "soft limit asks");
    CHECK(drug_check_program(d, 500, 200, &why) == PROGRAM_REJECTED, "10x rate rejected");
    CHECK(drug_check_program(d, 50, 900, &why) == PROGRAM_REJECTED, "too much volume rejected");
    CHECK(drug_check_program(d, 0, 200, &why) == PROGRAM_REJECTED, "zero rate rejected");
    CHECK(drug_check_program(NULL, 50, 200, &why) == PROGRAM_REJECTED, "unknown drug rejected");
    CHECK(drug_find("CHEMO-A") == d, "lookup ignores case");
}

int main(void)
{
    test_normal_runs();
    test_occlusion();
    test_noise_is_not_occlusion();
    test_free_flow_needs_hold_time();
    test_air();
    test_stale_sensor();
    test_dose_done_and_empty_bag();
    test_drug_library();
    printf("%d passed, %d failed\n", g_pass, g_fail);
    return g_fail ? 1 : 0;
}
