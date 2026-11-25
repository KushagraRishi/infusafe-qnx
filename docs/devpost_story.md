## Inspiration

Chemotherapy is given through infusion pumps, often slowly, over many hours or even days. If the line kinks, air gets in, or someone types 500 instead of 50, the patient can be harmed fast. In one published case (ISMP, June 2015), a patient meant to receive 4,500 mg of fluorouracil over 46 hours got the whole dose in about 2 hours because the pump was set up wrong.

This is not rare. The FDA's MAUDE database (via openFDA) holds over 53,000 infusion pump reports received in 2025 alone, about 147 a day. In 2024 a pump was recalled (FDA Class I) because a bug in its air-detection software could let a 1 mL air bubble reach the patient.

I also found a quieter problem. A safety check can have perfect logic and still be useless if it runs late. On Linux in Docker, my 1 ms safety loop sometimes stalled for 65 ms. For a chemo line, late is the same as wrong. So I built InfuSafe on a real-time OS.

## What it does

InfuSafe is an independent safety monitor that sits beside the pump:

- **Checks the pump 1,000 times a second:** flow, line pressure and air.
- **Blocks unsafe doses before the pump starts:** a drug library with soft limits (the nurse must confirm) and hard limits (the pump will not start).
- **Stops the pump in milliseconds** for a blocked line, free flow, an air bubble, too much air over time, a silent sensor, or a finished dose. An empty bag raises an alarm.
- **Shows up as a device file, /dev/infusafe:** `cat` it for live status, `echo "inject occlusion" > /dev/infusafe` to test a fault from any shell.
- **Bench mode** injects every fault many times and times each stop.

## How it uses QNX 8.0

Every core safety behavior maps to a real QNX mechanism and a file you can check:

- **Kernel timer pulses** drive the 1 kHz loops: `timer_create` with `SIGEV_PULSE_INIT`, received with `MsgReceivePulse` (`src/rt.c`).
- **Real-time priorities** with `SCHED_FIFO`: safety monitor 50, sensor 40, control 10, logger 5 (`src/rt.c`, `src/main.c`).
- **A resource manager** (`resmgr_attach`, `iofunc_*`) makes the monitor the device `/dev/infusafe` (`src/control.c`).
- **A custom boot image** built with `mkifs` (`qnx/infusafe.build`) boots QNX 8.0 in QEMU with InfuSafe inside.
- **Lock-free sharing:** sensor and monitor share readings through a seqlock, so the monitor never waits on a lock (`src/pump_sim.c`).

Built with QNX SDP 8.0 and `qcc` (`gcc_ntox86_64`, also builds for `aarch64le`), and run on QNX 8.0 in QEMU (x86_64). Build and run steps are in the README.

## Results (QNX 8.0 in QEMU)

- **100 out of 100 injected faults caught, none missed** (5 fault types, 20 runs each).
- Average time to stop the pump: air bubble 3.1 ms, silent sensor 4.4 ms, blocked line 9.7 ms, free flow 51.8 ms (it waits 50 ms on purpose to ignore brief spikes).
- The safety check itself takes under 1 microsecond.
- 30 unit tests pass on QNX.

## Challenges I ran into

Testing on QNX found three real bugs that my laptop tests never showed:

1. **The monitor printed its own log lines.** Console writes can block, which delayed safety by up to 12 ms. Now only a priority 5 logger thread prints.
2. **A deadlock on one CPU.** The monitor outranks the sensor thread. If it interrupted the sensor halfway through saving a reading, it waited for a write that could never finish. Now the monitor never waits; it uses the last good reading, and the silent-sensor check covers a stuck sensor.
3. **A bubble could slip past a late check** (4 times out of 5 in one test). Air is now a running total, so a missed sample cannot hide a bubble. After the fix: 20 of 20.

QNX host tools also have no macOS build, so the whole SDP runs in an x86_64 Linux container on my Apple Silicon Mac.

## Accomplishments that I'm proud of

- A complete, testable safety product, not just a demo: drug library, live device, fault bench, tests, and a bootable image.
- Using QNX's real-time features for what they are for: making a safety check arrive on time, every time.

## What I learned

A safety loop must never do I/O, never wait on a lock it does not need, and never trust a sensor that has gone quiet. A real-time OS turns those rules from hopes into guarantees.

## What's next for InfuSafe

- Run it on real pump hardware (a Raspberry Pi 4 with QNX, real pressure and air sensors).
- Split the monitor and the pump controller into separate QNX processes talking through message passing.
- A signed drug library that hospitals can update.
- A path toward medical safety certification.

Real-life footage in the presentation is from Pexels (Pexels License). Drug limits in the repo are sample values for the simulator.
