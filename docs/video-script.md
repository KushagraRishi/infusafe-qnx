# Demo video script (under 3 minutes)

Screen: a terminal running QNX in QEMU. Voice: you.

**0:00 to 0:20. The problem**
"Chemo goes in through an infusion pump. If the line kinks, or air gets in, or someone types 500 instead of 50, the patient is in danger within seconds. InfuSafe is a safety monitor that runs on QNX and stops the pump in milliseconds."

**0:20 to 0:40. QNX is running**
Show the boot ending with "QNX 8.0 is up". Type `uname -a`.
"This is QNX 8.0, booted from an image I built with mkifs."

**0:40 to 1:00. The typo**
`infusafe -d chemo-a -r 500 -v 200`
"500 mL/h is over the hard limit for this drug, so the pump never starts."

**1:00 to 1:50. Live faults**
`infusafe -d chemo-a -r 50 -v 200 &`
`cat /dev/infusafe`
"The monitor shows up as a device. This is a QNX resource manager."
`echo "inject occlusion" > /dev/infusafe` then `cat /dev/infusafe`
"The line is blocked. State STOP, reason occlusion, motor off."
`echo clear > /dev/infusafe`, then the same for `air`.

**1:50 to 2:30. The numbers**
`infusafe -b 20`
"Bench mode injects every fault again and again and times how fast the pump stops."
Read out the table.

**2:30 to 2:55. How it works**
Show `src/rt.c` for a moment.
"The monitor runs at priority 50, woken every millisecond by a QNX timer pulse. It never prints and never waits on a lock. Printing happens in a separate low-priority thread."

**2:55 to 3:00.** "InfuSafe. Built on QNX."
