/*
 * InfuSafe drug library.
 *
 * Each profile holds the limits a hospital pharmacy would set for one drug.
 * The pump checks every programmed rate against these before it starts,
 * and the monitor checks the measured flow against them while it runs.
 *
 * The numbers here are demo values for the simulator, not clinical advice.
 */
#ifndef INFUSAFE_DRUG_LIBRARY_H
#define INFUSAFE_DRUG_LIBRARY_H

#include <stddef.h>

typedef struct {
    const char *name;
    double soft_max_rate_ml_h;   /* above this: nurse must confirm */
    double hard_max_rate_ml_h;   /* above this: pump refuses to start */
    double max_volume_ml;        /* most this drug may deliver in one run */
} drug_profile_t;

typedef enum {
    PROGRAM_OK = 0,
    PROGRAM_NEEDS_CONFIRM,       /* soft limit crossed */
    PROGRAM_REJECTED             /* hard limit crossed, or bad input */
} program_check_t;

const drug_profile_t *drug_find(const char *name);
const drug_profile_t *drug_at(size_t index);
size_t drug_count(void);

/* Check a nurse's programmed rate and volume before the pump starts. */
program_check_t drug_check_program(const drug_profile_t *drug,
                                   double rate_ml_h, double volume_ml,
                                   const char **reason);

#endif
