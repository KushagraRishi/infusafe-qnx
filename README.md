# InfuSafe

A real-time safety monitor for infusion pumps, built on QNX 8.0.

Chemo drugs go into the body through an infusion pump. When something goes wrong with the line, every second counts. A kinked tube builds pressure. A loose cassette lets the drug pour in by gravity. A bubble of air heads for the vein. InfuSafe watches the pump 1,000 times a second and stops it the moment one of these happens.

## What it catches

| Problem | How InfuSafe sees it | What it does |
|---|---|---|
| Blocked line (occlusion) | Line pressure jumps 300 mmHg over normal, or climbs faster than 2,000 mmHg/s | Stops the pump |
| Free flow | Measured flow stays 25% over the set rate for 50 ms | Stops the pump |
| Air bubble | One bubble of 50 µL or more | Stops the pump |
| Too much air over time | 100 µL of small bubbles inside 15 minutes | Stops the pump |
| Sensor goes silent | No new reading for 5 ms | Stops the pump (it can't see, so it doesn't guess) |
| Dose finished | Delivered volume reaches the target | Stops the pump |
| Empty bag | Pressure on the bag side drops below -100 mmHg | Sounds an alarm |

Before the pump even starts, the nurse's program is checked against a drug library. Each drug has a soft limit (the nurse has to confirm) and a hard limit (the pump refuses). So a rate typed as 500 instead of 50 never runs.

## Why QNX

A safety check is only useful if it runs on time, every time. On a normal desktop OS the monitor can be paused for tens of milliseconds whenever something else wants the CPU. In our tests on Linux in Docker, the 1 ms heartbeat sometimes stretched to 65 ms. On QNX the monitor thread runs at a fixed real-time priority and is woken by a kernel timer pulse, so it keeps its deadline.

QNX features used:

- **Timer pulses** (`timer_create` with `SIGEV_PULSE_INIT`, `MsgReceivePulse`) drive the 1 kHz monitor loop and the sensor loop.
- **Fixed priorities** (`SCHED_FIFO`): monitor at 50, sensor at 40, control at 10. A slow command can never delay a safety check.
- **`ClockPeriod`** sets a 100 µs system tick so the 1 ms timer stays steady.
- **A resource manager** puts the pump in the filesystem as `/dev/infusafe`. You can read its status with `cat` and send it commands with `echo`, like any device.
- **No locks in the hot path.** The sensor and monitor share readings through a seqlock, so the monitor never waits on the sensor thread.

## How it is built

```
src/
  safety_rules.c   the checks above, pure logic, unit tested
  drug_library.c   soft and hard limits per drug
  pump_sim.c       simulated pump sensors, with fault injection
  monitor.c        1 kHz monitor thread, timing stats, event log
  control.c        /dev/infusafe resource manager (QNX) or stdin
  rt.c             QNX timer pulses and priorities, POSIX fallback
  main.c           program check, threads, bench mode
tests/
  test_rules.c     29 checks on the safety rules and drug library
```

The pump hardware is simulated. `pump_sim.c` makes one reading per millisecond for flow, two line pressures and an air detector. It can inject each fault on command, so every check can be tested the same way, many times.

## Build and run

You need QNX SDP 8.0 (a free non-commercial license is available from QNX).

```bash
source ~/qnx800/qnxsdp-env.sh
make qnx                    # x86_64, for QEMU
make qnx ARCH=aarch64le     # Raspberry Pi 4
```

Copy `build/qnx-x86_64/infusafe` to the target, then:

```bash
infusafe -l                          # list drug profiles
infusafe -d chemo-a -r 500 -v 200    # rejected: over the hard limit
infusafe -d chemo-a -r 50 -v 200     # runs, and creates /dev/infusafe
```

In a second shell on the target:

```bash
cat /dev/infusafe                       # live status as JSON
echo "inject occlusion" > /dev/infusafe
cat /dev/infusafe                       # state is STOP, reason occlusion
echo clear > /dev/infusafe
```

Bench mode injects every fault many times and reports how fast the pump was stopped:

```bash
infusafe -b 100
```

To run the logic and tests on any Linux or macOS machine:

```bash
make test
make && ./build/infusafe -b 20
```

## Results

RESULTS_PLACEHOLDER

## What's next

- Drive a real stepper motor and pressure sensor from a Raspberry Pi 4 running QNX.
- Move the drug library to a signed file the pharmacy can update.
- Run the monitor and the pump controller as separate processes, so a crash in one can't take down the other.

## License

MIT
