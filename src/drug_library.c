#include "drug_library.h"

#include <string.h>
#include <strings.h>

static const drug_profile_t k_drugs[] = {
    /* name                 soft    hard    max volume */
    { "saline",            500.0, 1000.0, 2000.0 },
    { "chemo-a",            60.0,  120.0,  250.0 },
    { "chemo-b",            25.0,   50.0,  100.0 },
    { "antiemetic",        150.0,  300.0,  100.0 },
    { "pain-opioid",         5.0,   10.0,   50.0 },
};

size_t drug_count(void) { return sizeof k_drugs / sizeof k_drugs[0]; }

const drug_profile_t *drug_at(size_t index)
{
    return index < drug_count() ? &k_drugs[index] : NULL;
}

const drug_profile_t *drug_find(const char *name)
{
    if (name == NULL) return NULL;
    for (size_t i = 0; i < drug_count(); i++) {
        if (strcasecmp(k_drugs[i].name, name) == 0) return &k_drugs[i];
    }
    return NULL;
}

program_check_t drug_check_program(const drug_profile_t *drug,
                                   double rate_ml_h, double volume_ml,
                                   const char **reason)
{
    const char *why = "ok";
    program_check_t result = PROGRAM_OK;

    if (drug == NULL) {
        why = "unknown drug";
        result = PROGRAM_REJECTED;
    } else if (!(rate_ml_h > 0.0) || !(volume_ml > 0.0)) {
        why = "rate and volume must be above zero";
        result = PROGRAM_REJECTED;
    } else if (rate_ml_h > drug->hard_max_rate_ml_h) {
        why = "rate is over the hard limit for this drug";
        result = PROGRAM_REJECTED;
    } else if (volume_ml > drug->max_volume_ml) {
        why = "volume is over the limit for this drug";
        result = PROGRAM_REJECTED;
    } else if (rate_ml_h > drug->soft_max_rate_ml_h) {
        why = "rate is over the soft limit, confirm to continue";
        result = PROGRAM_NEEDS_CONFIRM;
    }

    if (reason) *reason = why;
    return result;
}
