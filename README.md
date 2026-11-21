# InfuSafe

A safety monitor for chemo infusion pumps. It runs on QNX 8.0 and stops the pump within milliseconds when something goes wrong.

Chemo goes into the body through an infusion pump. Things go wrong with the line. A tube gets kinked and pressure builds. A cassette isn't seated and the drug pours in by gravity. A bubble of air heads for the vein. Someone types 500 instead of 50. InfuSafe checks the pump 1,000 times a second and stops it when any of these happen.

## Results on QNX 8.0

Each fault was injected 20 times on QNX 8.0 (x86_64, in QEMU). The time is from the moment the fault started to the moment the motor was switched off.

| Fault | Caught | Fastest | Average | Slowest |
|---|---|---|---|---|
| Blocked line | 20 of 20 | 5.8 ms | 9.7 ms | 39.2 ms |
| Free flow | 20 of 20 | 50.0 ms | 51.8 ms | 53.4 ms |
| Air bubble | 20 of 20 | 2.4 ms | 3.1 ms | 4.5 ms |
| Sensor goes silent | 20 of 20 | 2.6 ms | 4.4 ms | 10.8 ms |
| Empty bag (alarm) | 20 of 20 | under 0.01 ms | under 0.01 ms | under 0.01 ms |

100 out of 100 caught. None missed. The safety check itself takes under 1 µs.

Free flow waits 50 ms on purpose, so a short spike in flow doesn't stop a pump for no reason.

A note on the timing: QEMU on an Apple Silicon Mac translates every x86 instruction to ARM, and the emulated CPU has no TSC-deadline timer. So the 1 ms loop really ran about every 3 ms on average. Real hardware will be faster. Even so, nothing was missed.

All 30 unit tests pass on QNX.

## What it catches

| Problem | How InfuSafe sees it | What it does |
|---|---|---|
| Blocked line | Pressure 300 mmHg over normal, or rising faster than 2,000 mmHg per second | Stops the pump |
| Free flow | Flow stays 25% over the set rate for 50 ms | Stops the pump |
| Air bubble | One bubble of 50 µL or more | Stops the pump |
| Too much air | 100 µL of small bubbles within 15 minutes | Stops the pump |
| Sensor goes silent | No new reading for 5 ms | Stops the pump. It can't see, so it doesn't guess. |
| Dose finished | Delivered volume reaches the target | Stops the pump |
| Empty bag | Bag-side pressure below -100 mmHg | Sounds an alarm |

Before the pump starts, the nurse's program is checked against a drug library. Every drug has a soft limit and a hard limit. Over the soft limit, the nurse has to confirm. Over the hard limit, the pump won't start. So a rate typed as 500 instead of 50 never runs.

## Why QNX

A safety check only helps if it runs on time, every time.

I ran the same code on Linux in Docker first. The 1 ms loop sometimes stalled for 65 ms, long enough to trip the "sensor went silent" check for no reason. On QNX the monitor runs at a fixed real-time priority, so nothing else can push it aside.

What it uses from QNX:

- **Timer pulses.** A kernel timer sends a pulse every 1 ms (`timer_create` with `SIGEV_PULSE_INIT`). The monitor and the sensor each wait for theirs with `MsgReceivePulse`.
- **Fixed priorities** with `SCHED_FIFO`. Monitor 50, sensor 40, control 10, logger 5. A slow command or a slow console can never delay a safety check.
- **A resource manager.** The pump shows up as the file `/dev/infusafe`. `cat` it to see the status. `echo` a command into it to test a fault.
- **No waiting in the safety loop.** The monitor never prints and never waits on the sensor. Readings are shared through a seqlock that the monitor reads without blocking.

## Bugs QNX helped me find

Running on QNX found three real bugs.

1. **The monitor printed its own log lines.** Writing to the serial console can block, and that held up the safety loop by up to 12 ms. Now the monitor only saves events in memory, and a separate low-priority thread prints them.
2. **A deadlock on one CPU.** The monitor outranks the sensor thread. If it interrupted the sensor halfway through saving a reading, it waited for the reading to finish. But the sensor never got the CPU back, so both froze. Now the monitor never waits. If a reading is half-written, it uses the last good one. If the sensor stays stuck, the silent-sensor check stops the pump.
3. **A bubble could slip past.** The air detector reported each bubble in just one reading. If the monitor ran late and skipped that reading, the bubble was missed (4 out of 5 times in one test). Now the detector keeps a running total of all air it has seen, and the monitor checks how much was added since it last looked.

## How it's built

```
src/
  safety_rules.c   the checks, pure logic, unit tested
  drug_library.c   soft and hard limits for each drug
  pump_sim.c       simulated pump sensors, with fault injection
  monitor.c        1 kHz monitor thread, timing stats, event log, logger thread
  control.c        /dev/infusafe resource manager (QNX), or stdin elsewhere
  rt.c             QNX timer pulses and priorities, with a POSIX fallback
  main.c           program check, threads, bench mode
tests/
  test_rules.c     30 checks on the safety rules and drug library
qnx/
  infusafe.build   mkifs buildfile for a bootable QNX image
  demo.sh          demo that runs on the target
scripts/
  qnx-shell.sh     run a command with QNX SDP 8.0 loaded (Linux x86_64 container)
  install-sdp.sh   install QNX SDP 8.0 into that container
  run-qemu.py      boot the image in QEMU and run commands on it
```

The pump hardware is simulated. `pump_sim.c` makes a reading every millisecond: flow, pressure on both sides of the pump, and air. You can inject each fault on command, so every check can be tested the same way, again and again.

## Build and run

You need QNX SDP 8.0. QNX gives a free license for non-commercial use.

On Linux with the SDP installed:

```bash
source ~/qnx800/qnxsdp-env.sh
make qnx                    # x86_64, for QEMU
make qnx ARCH=aarch64le     # Raspberry Pi 4
cd qnx && mkifs infusafe.build ../build/infusafe.ifs
```

On a Mac, QNX has no host tools, so I run them in an x86_64 Linux container:

```bash
docker build --platform linux/amd64 -t infusafe-qnx-host docker
scripts/install-sdp.sh you@example.com
scripts/qnx-shell.sh "make qnx && cd qnx && mkifs infusafe.build ../build/infusafe.ifs"
```

Boot it in QEMU and run the demo:

```bash
scripts/run-qemu.py                    # runs demo.sh
scripts/run-qemu.py "infusafe -b 20"   # just the bench
scripts/run-qemu.py --interactive      # a QNX shell of your own
```

On the QNX target:

```bash
infusafe -l                          # list the drug profiles
infusafe -d chemo-a -r 500 -v 200    # refused: over the hard limit
infusafe -d chemo-a -r 50 -v 200 &   # starts, and creates /dev/infusafe

cat /dev/infusafe                    # status as JSON
echo "inject occlusion" > /dev/infusafe
cat /dev/infusafe                    # state STOP, reason occlusion
echo clear > /dev/infusafe

infusafe -b 20                       # inject every fault 20 times, show the table
```

The faults you can inject are `occlusion`, `free-flow`, `air`, `empty-bag` and `sensor-hang`.

The safety logic and tests also build on any Linux machine:

```bash
make test
make && ./build/infusafe -b 20
```

## What's next

- Real hardware: a stepper motor, a pressure sensor and an air detector on a Raspberry Pi 4 running QNX.
- Run the monitor and the pump controller as separate processes, so a crash in one can't take down the other.
- A signed drug library file that the pharmacy can update.

The drug limits in this repo are sample values for the simulator.

## License

MIT
