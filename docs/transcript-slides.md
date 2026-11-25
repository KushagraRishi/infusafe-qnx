# InfuSafe pitch: what to say on each slide

About 9 minutes in total. Speak slowly. Each slide builds itself and the video clips play on their own, so just start talking when the slide appears.

---

## Slide 1. InfuSafe

Hi, I'm Kushagra Chaudhary, and this is InfuSafe.

When someone gets chemo, a machine called an infusion pump pushes the drug into their vein. InfuSafe is a safety check for that pump. It watches the pump a thousand times every second, and stops it the moment something goes wrong. I built it on QNX 8.0.

---

## Slide 2. Safety is our first priority

For us, safety comes first.

Chemo is strong medicine. A small mistake can hurt a patient very fast.

Pumps already have alarms. But an alarm only helps if it runs on time.

So we built a safety check that is always on time, every single millisecond.

---

## Slide 3. How a chemo infusion works

Let me show you how it works, with real footage.

First, the drug hangs in a bag above the patient, and you can see it dripping.

Second, a nurse types in the speed, and the pump pushes the drug.

Third, a thin tube carries it into the patient's vein. This can go on for hours, or even days.

---

## Slide 4. Three ways it can go wrong

Now, three things can go wrong.

One: the tube gets kinked. The drug stops flowing, and pressure builds up.

Two: air gets into the line, and a bubble moves toward the vein.

Three: someone types the wrong number. 500 instead of 50. That's ten times the dose.

---

## Slide 5. It really happens

And this really happens. A patient was supposed to get a chemo drug slowly, over 46 hours. The pump was set up wrong, and the whole dose went in within about 2 hours. The patient had to be admitted to hospital.

One wrong setting. That's all it took.

---

## Slide 6. How often

It's not rare. In five years, the FDA got about 56,000 reports of pump problems. There were 87 recalls, and 14 of them were in the most serious class.

And it's still happening. In 2024, a pump was recalled because a software bug could let an air bubble reach the patient. Two people were hurt.

---

## Slide 7. The gap

Here's the hidden problem. A safety check only helps if it runs on time.

In many systems, one program runs everything: the screen, the buttons, the motor and the alarms. When it gets busy, the safety check waits in line.

I measured this. My check was planned for every 1 millisecond. On a normal Linux setup, it was sometimes 65 milliseconds late. The check was right, but it came too late.

---

## Slide 8. Our solution

So we built InfuSafe, a safety check that is never late.

It reads the pump's sensors: flow, pressure and air. It runs on QNX, checks them every millisecond, and always has the highest priority.

Before the pump starts, it checks the dose against a drug library, so 500 instead of 50 never runs.

If anything goes wrong, it stops the motor in milliseconds, or sounds an alarm.

---

## Slide 9. Watch it catch a blocked line

This is real output from QNX 8.0, not a mockup.

I block the line. InfuSafe stops the pump in about 9 milliseconds, and you can see the status change to STOP.

In the full demo, it also refuses a rate of 500, starts safely at 50, and stops an air bubble in about 3 milliseconds.

---

## Slide 10. Who it helps

This helps everyone around the infusion.

Patients: overdoses, air bubbles and blocked lines get stopped.
Nurses: a second check on every number they type.
Hospitals: an extra safety layer on every pump.
And pump makers: a ready, open-source safety layer they can build on.

---

## Slide 11. Built to scale

And this can help at a big scale.

About 9 in 10 hospital patients get medicine through an IV, and most of it runs through pumps.

InfuSafe is software only, so it can be added to any pump that has the right sensors. It's tiny: it uses about 0.1 percent of one processor. It runs on QNX on both Intel and ARM chips. One drug library can protect every pump in a hospital. And it's open source, with a test bench any pump maker can run.

---

## Slide 12. Why QNX

Why QNX? Because the whole idea is timing.

On QNX, safety always goes first. The QNX kernel itself wakes our monitor every millisecond, like a heartbeat. And the microkernel keeps one fault from spreading.

This is the real code that does it. The rest of the QNX work, like the resource manager and our own boot image, is listed on the right.

---

## Slide 13. Results

I tested every fault 20 times. That's 100 tests, and InfuSafe caught all 100. Not one was missed.

An air bubble is stopped in about 3 milliseconds. A blocked line in about 10. Free flow takes about 50, on purpose, so a tiny spike doesn't stop the pump for nothing. And the safety check itself takes less than one millionth of a second.

---

## Slide 14. Real engineering

Testing on QNX also found three real bugs in my code, and I fixed all three.

The monitor could be held up by printing to the screen. Now a low-priority helper prints.
Two parts could freeze each other. Now the monitor never waits.
And a bubble could slip past a late check. Now it catches 20 out of 20.

That's why safety code should be tested on a real-time system.

---

## Slide 15. Built to meet every judging point

To sum up.

Technology: real QNX features, like timer pulses, real-time priorities, a resource manager and our own boot image.
Design: a complete product, not just a test.
Impact: a real, documented danger in hospitals.
Innovation: safety as its own real-time check that anyone can test.

---

## Slide 16. Thank you

Next, I want to run InfuSafe on real pump hardware, split it into separate QNX processes, and work toward medical safety certification.

Because safety should never have to wait.

Thank you. All the code is on GitHub. I'm happy to take your questions.
