# InfuSafe presentation content

## Prompt to paste into ChatGPT

Make a 12-slide presentation for a hackathon pitch, using the content below. The event is the QNX Global Hackathon, category Robotics & Medical. Keep slides visual, with few words on each, and put the longer talk track in the speaker notes. Do not add any facts or numbers that are not in this content.

---

## Slide 1. Title

**InfuSafe**
A real-time safety monitor for chemo infusion pumps, built on QNX 8.0

QNX Global Hackathon · Robotics & Medical
Kushagra Chaudhary
github.com/KushagraRishi/infusafe-qnx

**Speaker notes:** Hi, I'm Kushagra Chaudhary. This is InfuSafe, a real-time safety monitor for chemo infusion pumps, built on QNX 8.0 for the Robotics & Medical track.

---

## Slide 2. The hackathon problem statement

**Category: Robotics & Medical**
"Real-time applications where timing, safety, or reliability is critical."
(QNX Global Hackathon, official rules)

**The task:** Build a working project that runs on QNX 8.0, on real hardware or in QEMU.

**How judges score it (all equal weight):**
- **Technological Implementation:** How well is it built, and how well does it use QNX 8.0?
- **Design:** Is it a complete product, not just a proof of concept?
- **Potential Impact:** Does it solve a real problem, and show why a real-time OS like QNX is the right choice?
- **Innovation:** Is it a creative, non-obvious use of QNX?

**Speaker notes:** I entered Robotics & Medical, which is about real-time systems where timing and safety are critical. Judges score four things equally. I built InfuSafe to meet all four.

---

## Slide 3. The problem

**Chemo pumps fail in three common ways**

1. **Kinked tube:** flow stops and pressure builds.
2. **Air in the line:** a bubble heads for the vein.
3. **Wrong rate typed:** 500 mL/h instead of 50.

**Speaker notes:** Chemo is given through an infusion pump. The drug drips from a bag, and the pump pushes it down a thin tube into the vein. Three things go wrong again and again: a kinked tube, air in the line, or a rate typed wrong. Each one can hurt a patient within seconds.

---

## Slide 4. This is not rare

**56,000** reports of infusion pump problems sent to the FDA, from 2005 to 2009.
**87** pump recalls in the same five years.
The FDA linked many of these problems to design and engineering.

Source: FDA, Infusion Pump Improvement Initiative white paper (2010)

**Speaker notes:** From 2005 to 2009, the FDA received about 56,000 reports of problems with infusion pumps, and there were 87 recalls. The FDA's own review linked many of them to design and engineering. So a design that makes safety checks more reliable has real value.

---

## Slide 5. The gap

**When one program does it all, safety can wait**

- The screen, buttons, motor, logs and alarms all share one program.
- A busy moment can make the safety check wait its turn.
- I measured it: on Linux in Docker, my 1 ms safety loop sometimes stalled for up to 65 ms.

**Speaker notes:** If one program runs everything, a busy moment can delay the safety check. I saw this myself. On a normal Linux setup, my 1 millisecond safety loop sometimes stalled for 65 milliseconds. For a blocked chemo line, that is far too long.

---

## Slide 6. The solution

**InfuSafe: an independent safety monitor**

- **1,000 checks a second:** flow, pressure and air, every millisecond.
- **Drug library:** every drug has a soft limit (the nurse must confirm) and a hard limit (the pump will not start). So 500 instead of 50 never runs.
- **Stops the pump fast:** about 10 ms for a blocked line, about 3 ms for an air bubble.
- **A live device:** it shows up as the file /dev/infusafe. You can read its status or test it from any shell.

**What it catches:**
| Problem | How it sees it | What it does |
|---|---|---|
| Blocked line | Pressure 300 mmHg over normal, or rising faster than 2,000 mmHg per second | Stops the pump |
| Free flow | Flow stays 25% over the set rate for 50 ms | Stops the pump |
| Air bubble | One bubble of 50 µL or more | Stops the pump |
| Too much air | 100 µL of small bubbles within 15 minutes | Stops the pump |
| Sensor goes silent | No new reading for 5 ms | Stops the pump |
| Dose finished | Delivered volume reaches the target | Stops the pump |
| Empty bag | Bag-side pressure below -100 mmHg | Sounds an alarm |

**Speaker notes:** InfuSafe is a separate safety monitor that sits beside the pump. It checks the pump 1,000 times a second. Before the pump starts, it checks the rate against a drug library, so a typo like 500 instead of 50 never runs. When something goes wrong, it stops the pump in milliseconds.

---

## Slide 7. Why a real-time OS like QNX

- **Fixed priorities:** the safety check runs at priority 50, the logger at 5. Nothing can push safety aside.
- **Kernel timer pulses:** the QNX kernel wakes the monitor every 1 ms.
- **Microkernel:** parts run separately, so one fault stays contained.
- **Made for this market:** QNX already serves medical device makers.

**Speaker notes:** The whole point is timing. On QNX, priorities mean something. The safety check outranks everything else, and the kernel itself wakes it every millisecond. That is why a real-time OS is the right foundation.

---

## Slide 8. How it uses QNX 8.0

| QNX feature | What I used | File |
|---|---|---|
| Kernel timer pulses | timer_create, SIGEV_PULSE_INIT, MsgReceivePulse | src/rt.c |
| Real-time priorities | SCHED_FIFO threads: monitor 50, sensor 40, control 10, logger 5 | src/rt.c, src/main.c |
| Resource manager | resmgr_attach and iofunc for /dev/infusafe | src/control.c |
| Custom boot image | mkifs buildfile, boots in QEMU | qnx/infusafe.build |
| Lock-free sharing | seqlock, so the monitor never waits | src/pump_sim.c |

Cross-compiled with qcc for x86_64 and aarch64le. All 30 unit tests pass on QNX.

**Speaker notes:** Here is exactly how it uses QNX, with the files, so the judges can check the code. Timer pulses drive the loop. The threads run with real-time priorities. The device file is a real QNX resource manager. And it boots from my own QNX image.

---

## Slide 9. Live demo on QNX 8.0

(Play the demo video here.)

1. **Boots** QNX 8.0 in QEMU from my own image.
2. **Refuses 500 mL/h:** it is over the hard limit for the drug.
3. **Starts at 50 mL/h** and shows up as /dev/infusafe.
4. **Blocked line:** pump stopped in about 9 ms.
5. **Air bubble:** pump stopped in under 3 ms.
6. **Bench:** every fault injected 5 times. 25 of 25 caught.

**Speaker notes:** This is the real thing, running on QNX 8.0 in QEMU. It refuses the 500 typo, starts at 50, stops a blocked line in about 9 milliseconds and an air bubble in under 3. The bench catches every fault.

---

## Slide 10. Results

**100 / 100 faults caught, none missed** (20 runs of each fault)

| Fault | Caught | Average time to stop |
|---|---|---|
| Air bubble | 20 of 20 | 3.1 ms |
| Sensor goes silent | 20 of 20 | 4.4 ms |
| Blocked line | 20 of 20 | 9.7 ms |
| Free flow | 20 of 20 | 51.8 ms (waits 50 ms on purpose, to ignore short spikes) |
| Empty bag (alarm) | 20 of 20 | under 0.01 ms |

The safety check itself takes **under 1 microsecond**.
Measured on QNX 8.0 in QEMU on a Mac. Real hardware should be faster.

**Speaker notes:** Across 20 runs of each fault, InfuSafe caught all 100, with none missed. These were measured in emulation, so real hardware should be faster.

---

## Slide 11. Three real bugs QNX helped me find

1. **The monitor printed to the console.** Console writes can block, and that delayed safety by up to 12 ms.
   **Fixed:** now only a low-priority logger thread prints.
2. **A deadlock on one CPU.** The monitor waited for a half-written reading that the sensor could never finish.
   **Fixed:** now the monitor never waits. It uses the last good reading.
3. **A bubble could slip past.** A late check missed a bubble 4 times out of 5.
   **Fixed:** air is now a running total. 20 of 20 caught.

**Speaker notes:** Running on QNX found three real bugs that a normal laptop test did not. All three are fixed and tested. This is exactly why safety code should be tested on a real-time OS.

---

## Slide 12. How InfuSafe meets the judging criteria, and what's next

- **Technological Implementation:** timer pulses, real-time priorities, a resource manager and a custom boot image. 30 tests pass on QNX.
- **Design:** a complete flow: drug library, live device, fault bench, one-script build and boot.
- **Potential Impact:** targets a problem the FDA has documented, in the medical device market QNX serves.
- **Innovation:** safety lives in its own real-time monitor, testable from any shell through /dev/infusafe.

**What comes next:**
- Real pump hardware on a Raspberry Pi 4 running QNX
- Monitor and pump as separate processes, talking by QNX message passing
- A signed drug library the pharmacy can update
- A path toward medical safety certification

**Thank you.** github.com/KushagraRishi/infusafe-qnx

**Speaker notes:** To sum up, InfuSafe is built on real QNX features, it is a complete product, it targets a documented problem, and it puts safety in its own real-time monitor. Next, I want to run it on real pump hardware. Thank you. Everything is on GitHub.

---

## Facts to keep straight

- The 56,000 and 87 figures come from the FDA white paper. They count reports and recalls, not confirmed injuries.
- "One program does it all" is a simplified picture, not a claim about any brand. Many real pumps already have their own alarms.
- All timing numbers come from my own tests on QNX 8.0 in QEMU.
- The drug limits are sample values for the simulator.
