# InfuSafe
#
#   make            build for this computer (POSIX fallback, for testing)
#   make test       run the unit tests
#   make qnx        cross-build for QNX 8.0 x86_64 (needs qnxsdp-env.sh sourced)
#   make qnx ARCH=aarch64le   same, for a Raspberry Pi 4 or other ARM board

SRC     := src/main.c src/monitor.c src/control.c src/pump_sim.c \
           src/safety_rules.c src/drug_library.c src/rt.c
CFLAGS  += -std=c11 -O2 -Wall -Wextra -D_POSIX_C_SOURCE=200809L -D_DEFAULT_SOURCE
LDLIBS  += -lpthread -lm

ARCH    ?= x86_64
QCC_VARIANT_x86_64   := gcc_ntox86_64
QCC_VARIANT_aarch64le := gcc_ntoaarch64le

.PHONY: all test qnx clean

all: build/infusafe

build/infusafe: $(SRC) src/*.h
	@mkdir -p build
	$(CC) $(CFLAGS) -D_DARWIN_C_SOURCE -o $@ $(SRC) $(LDLIBS)

build/test_rules: tests/test_rules.c src/safety_rules.c src/drug_library.c src/*.h
	@mkdir -p build
	$(CC) $(CFLAGS) -D_DARWIN_C_SOURCE -o $@ tests/test_rules.c src/safety_rules.c src/drug_library.c -lm

test: build/test_rules
	./build/test_rules

qnx: $(SRC) src/*.h
	@mkdir -p build/qnx-$(ARCH)
	qcc -V$(QCC_VARIANT_$(ARCH)) -std=gnu11 -O2 -Wall -Wextra \
	    -o build/qnx-$(ARCH)/infusafe $(SRC) -lm
	qcc -V$(QCC_VARIANT_$(ARCH)) -std=gnu11 -O2 -Wall \
	    -o build/qnx-$(ARCH)/test_rules tests/test_rules.c src/safety_rules.c src/drug_library.c -lm

clean:
	rm -rf build
