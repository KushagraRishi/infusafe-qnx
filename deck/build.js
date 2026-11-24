// Builds deck/InfuSafe.pptx: the live pitch deck for the QNX Global Hackathon (Robotics & Medical).
// Speaker notes on every slide hold the talk track. Video clips come from the demo animation.
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');

const SKILL = process.env.PPTX_SKILL;
const { applyTheme } = require(path.join(SKILL, 'scripts/apply_theme.js'));
const A = (f) => path.join(__dirname, 'assets', f);
const b64 = (f) => 'image/jpeg;base64,' + fs.readFileSync(A(f)).toString('base64');

const THEME = {
  name: 'InfuSafe Night',
  headFontFace: 'Calibri',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '0B0C2E', lt1: 'FFFFFF', dk2: '1C1D52', lt2: 'BFC6FF',
    accent1: 'FFD23F', accent2: 'FF5D8F', accent3: '56E8FF', accent4: '38E08E', accent5: '8B5CFF', accent6: 'FF8D3F',
    hlink: '56E8FF', folHlink: 'BFC6FF',
  },
};
const HEX = THEME.colors;

async function icon(Comp, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
  pres.title = 'InfuSafe';
  pres.author = 'Kushagra Chaudhary';
  pres.subject = 'QNX Global Hackathon, Robotics and Medical';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: 'TITLE_DARK',
    background: { color: HEX.dk1 },
    objects: [],
  });
  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: HEX.dk1 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 34, bold: true, color: C.background1, valign: 'middle', margin: 0 }, text: '' } },
      { text: { text: 'InfuSafe  ·  QNX Global Hackathon', options: { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 11, color: C.background2, margin: 0 } } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 11, color: HEX.lt2, align: 'right' },
  });

  // ---------- small builders ----------
  let n = 0;
  const card = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.18, fill: { color: o.fill || C.text2 }, line: { color: o.line || C.text2, width: 1 },
    shadow: { type: 'outer', color: '000000', opacity: 0.35, blur: 8, offset: 3, angle: 90 }, objectName: o.name || `card ${++n}`,
  });
  const frame = (s, img, x, y, w, h, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.16, fill: { color: C.accent3, transparency: 70 }, line: { color: C.accent3, width: 1.5 }, objectName: name + ' frame' });
    s.addImage({ data: b64(img), x, y, w, h, objectName: name, altText: name });
  };
  const video = (s, clip, poster, x, y, w, h, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.16, fill: { color: C.accent1, transparency: 70 }, line: { color: C.accent1, width: 1.5 }, objectName: name + ' frame' });
    s.addMedia({ type: 'video', path: A(clip), cover: b64(poster), x, y, w, h, objectName: name });
  };
  const dot = async (s, x, y, d, color, Ic, name) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 }, objectName: name + ' circle' });
    s.addImage({ data: await icon(Ic, HEX.dk1), x: x + d * 0.22, y: y + d * 0.22, w: d * 0.56, h: d * 0.56, objectName: name + ' icon', altText: name });
  };
  const row = async (s, x, y, w, Ic, color, head, body, name) => {
    await dot(s, x, y, 0.62, color, Ic, name);
    s.addText([
      { text: head, options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: body, options: { fontSize: 15, color: C.background2 } },
    ], { x: x + 0.82, y: y - 0.08, w: w - 0.82, h: 0.9, valign: 'top', margin: 0, isTextBox: true, objectName: name + ' text' });
  };
  const add = (sec) => pres.addSlide({ masterName: 'CONTENT', sectionTitle: sec });

  // ================= 1. Title =================
  pres.addSection({ title: 'Intro' });
  let s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'Intro' });
  s.addText('QNX GLOBAL HACKATHON  ·  ROBOTICS & MEDICAL', { x: 0.7, y: 1.2, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.accent1, charSpacing: 2, margin: 0, isTextBox: true, objectName: 'eyebrow' });
  s.addText('InfuSafe', { x: 0.7, y: 1.75, w: 6, h: 1.3, fontSize: 66, bold: true, color: C.background1, fontFace: THEME.headFontFace, margin: 0, isTextBox: true, objectName: 'title' });
  s.addText('A real-time safety monitor for chemo infusion pumps, built on QNX 8.0', { x: 0.7, y: 3.1, w: 5.6, h: 1.0, fontSize: 22, color: C.background2, margin: 0, isTextBox: true, objectName: 'subtitle' });
  s.addText([
    { text: 'Kushagra Chaudhary', options: { bold: true, color: C.background1, breakLine: true } },
    { text: 'github.com/KushagraRishi/infusafe-qnx', options: { color: C.accent3 } },
  ], { x: 0.7, y: 5.3, w: 5.6, h: 0.9, fontSize: 16, margin: 0, isTextBox: true, objectName: 'presenter' });
  frame(s, 's_38.00.jpg', 6.75, 1.6, 6.0, 3.375, 'InfuSafe guardian beside the pump');
  s.addNotes(`Hi, I'm Kushagra Chaudhary. This is InfuSafe, a real-time safety monitor for chemo infusion pumps, built on QNX 8.0 for the Robotics and Medical track.

In the next few minutes I'll show you the problem, why timing matters, what I built, and a live run on QNX.`);

  // ================= 2. The challenge =================
  pres.addSection({ title: 'The challenge' });
  s = add('The challenge');
  s.addText('The challenge we picked', { placeholder: 'title' });
  card(s, 0.6, 1.5, 5.8, 3.0, { fill: C.text2, name: 'problem statement card' });
  s.addText([
    { text: 'Robotics & Medical', options: { bold: true, fontSize: 22, color: C.accent1, breakLine: true } },
    { text: '“Real-time applications where timing, safety, or reliability is critical.”', options: { fontSize: 22, italic: true, color: C.background1, breakLine: true } },
    { text: 'QNX Global Hackathon, official rules', options: { fontSize: 13, color: C.background2 } },
  ], { x: 0.95, y: 1.75, w: 5.1, h: 2.5, valign: 'top', margin: 0, paraSpaceAfter: 10, isTextBox: true, objectName: 'problem statement' });
  s.addText('The task: build a working project that runs on QNX 8.0, on real hardware or QEMU.', { x: 0.6, y: 4.8, w: 5.8, h: 0.9, fontSize: 17, color: C.background2, margin: 0, isTextBox: true, objectName: 'task' });
  const crit = [
    [fa.FaCogs, HEX.accent3, 'Technological Implementation', 'Real engineering that truly runs on QNX 8.0'],
    [fa.FaPalette, HEX.accent2, 'Design', 'A complete product, not a proof of concept'],
    [fa.FaHeartbeat, HEX.accent4, 'Potential Impact', 'A real problem, and why real-time QNX fits'],
    [fa.FaLightbulb, HEX.accent1, 'Innovation', 'A non-obvious use of QNX'],
  ];
  s.addText('How judges score it (equal weight)', { x: 6.9, y: 1.5, w: 5.8, h: 0.4, fontSize: 16, bold: true, color: C.background2, margin: 0, isTextBox: true, objectName: 'criteria heading' });
  for (let i = 0; i < 4; i++) {
    const cx = 6.9 + (i % 2) * 2.95, cy = 2.05 + Math.floor(i / 2) * 2.3;
    card(s, cx, cy, 2.8, 2.1, { name: `criterion ${i + 1} card` });
    await dot(s, cx + 0.25, cy + 0.25, 0.6, crit[i][1], crit[i][0], `criterion ${i + 1}`);
    s.addText([
      { text: crit[i][2], options: { bold: true, fontSize: 15, color: C.background1, breakLine: true } },
      { text: crit[i][3], options: { fontSize: 13, color: C.background2 } },
    ], { x: cx + 0.25, y: cy + 0.95, w: 2.35, h: 1.05, valign: 'top', margin: 0, isTextBox: true, objectName: `criterion ${i + 1} text` });
  }
  s.addNotes(`I entered the Robotics and Medical category. The hackathon describes it as real-time applications where timing, safety, or reliability is critical.

Judges score four things equally: how well it is built on QNX 8.0, whether it is a complete product, its real-world impact and why real-time matters, and how creative the use of QNX is. I built InfuSafe to hit all four.`);

  // ================= 3. The problem =================
  pres.addSection({ title: 'The problem' });
  s = add('The problem');
  s.addText('Chemo pumps fail in three common ways', { placeholder: 'title' });
  video(s, 'clip_problem.mp4', 'poster_problem.jpg', 0.6, 1.55, 7.2, 4.05, 'Problem video: real footage with animated labels');
  s.addText('Click to play  ·  real hospital footage', { x: 0.6, y: 5.75, w: 7.2, h: 0.35, fontSize: 12, color: C.background2, margin: 0, isTextBox: true, objectName: 'video caption' });
  await row(s, 8.3, 1.7, 4.5, fa.FaCompressArrowsAlt, HEX.accent2, 'Kinked tube', 'Flow stops and pressure builds.', 'kink');
  await row(s, 8.3, 3.05, 4.5, fa.FaCircle, HEX.accent3, 'Air in the line', 'A bubble heads for the vein.', 'air');
  await row(s, 8.3, 4.4, 4.5, fa.FaKeyboard, HEX.accent1, 'Wrong rate typed', '500 mL/h instead of 50.', 'typo');
  s.addNotes(`Chemo is given through an infusion pump. The drug drips from a bag, and the pump pushes it down a thin tube into the vein.

[Play the clip.]

Three things go wrong again and again. A tube gets kinked and pressure builds. Air gets into the line. Or someone types 500 instead of 50. Each one can hurt a patient within seconds.`);

  // ================= 4. Why it matters =================
  s = add('The problem');
  s.addText('This is not rare', { placeholder: 'title' });
  s.addText('56,000', { x: 0.6, y: 1.7, w: 6.2, h: 1.5, fontSize: 96, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: 'stat 56000' });
  s.addText('reports of infusion pump problems sent to the FDA from 2005 to 2009', { x: 0.6, y: 3.25, w: 5.9, h: 0.9, fontSize: 20, color: C.background1, margin: 0, isTextBox: true, objectName: 'stat 56000 label' });
  s.addText('87', { x: 0.6, y: 4.35, w: 2.0, h: 1.0, fontSize: 60, bold: true, color: C.accent2, margin: 0, isTextBox: true, objectName: 'stat 87' });
  s.addText('pump recalls in the same five years. The FDA linked many problems to design and engineering.', { x: 2.5, y: 4.45, w: 4.2, h: 1.0, fontSize: 16, color: C.background2, margin: 0, valign: 'middle', isTextBox: true, objectName: 'stat 87 label' });
  s.addText('Source: FDA, Infusion Pump Improvement Initiative white paper (2010)', { x: 0.6, y: 6.2, w: 6.2, h: 0.35, fontSize: 11, color: C.background2, margin: 0, isTextBox: true, objectName: 'source' });
  frame(s, 's_14.20.jpg', 7.2, 1.7, 5.5, 3.094, 'Air in the line on real footage');
  s.addNotes(`This is not rare. From 2005 to 2009, the FDA received about 56,000 reports of problems with infusion pumps, and there were 87 recalls. The FDA's own review linked many of them to design and engineering problems.

So a design that makes safety checks more reliable has real value.`);

  // ================= 5. The gap =================
  s = add('The problem');
  s.addText('When one program does it all, safety can wait', { placeholder: 'title' });
  frame(s, 's_29.60.jpg', 0.6, 1.6, 6.4, 3.6, 'One program does it all, the safety check waits');
  await row(s, 7.5, 1.7, 5.2, fa.FaLayerGroup, HEX.accent3, 'Everything shares one program', 'Screen, buttons, motor, logs and alarms take turns.', 'shared');
  await row(s, 7.5, 3.0, 5.2, fa.FaHourglassHalf, HEX.accent6, 'Busy moments delay checks', 'A safety check can wait behind other work.', 'delay');
  await row(s, 7.5, 4.3, 5.2, fa.FaExclamationTriangle, HEX.accent2, 'We measured it', 'On Linux in Docker, our 1 ms loop stalled for up to 65 ms.', 'measured');
  s.addNotes(`Here is the gap. If one program runs the screen, the buttons, the motor and the alarms, a busy moment can make the safety check wait its turn.

I measured this myself. On a normal Linux setup in Docker, my 1 millisecond safety loop sometimes stalled for 65 milliseconds. For a blocked chemo line, that is far too long.`);

  // ================= 6. The solution =================
  pres.addSection({ title: 'The solution' });
  s = add('The solution');
  s.addText('InfuSafe: an independent safety monitor', { placeholder: 'title' });
  video(s, 'clip_solution.mp4', 'poster_solution.jpg', 0.6, 1.55, 7.2, 4.05, 'Solution video: InfuSafe animation');
  s.addText('Click to play  ·  animated walkthrough', { x: 0.6, y: 5.75, w: 7.2, h: 0.35, fontSize: 12, color: C.background2, margin: 0, isTextBox: true, objectName: 'video caption' });
  await row(s, 8.3, 1.55, 4.5, fa.FaTachometerAlt, HEX.accent1, '1,000 checks a second', 'Flow, pressure and air, every millisecond.', 'checks');
  await row(s, 8.3, 2.6, 4.5, fa.FaPrescriptionBottleAlt, HEX.accent4, 'Drug library', 'Soft and hard limits stop a wrong dose.', 'library');
  await row(s, 8.3, 3.65, 4.5, fa.FaHandPaper, HEX.accent2, 'Stops the pump fast', 'About 10 ms for a block, 3 ms for air.', 'stops');
  await row(s, 8.3, 4.7, 4.5, fa.FaTerminal, HEX.accent3, 'A live device', '/dev/infusafe: read it, test it.', 'device');
  s.addNotes(`InfuSafe is a separate safety monitor that sits beside the pump.

[Play the clip.]

It checks flow, pressure and air 1,000 times a second. Before the pump starts, it checks the rate against a drug library with soft and hard limits, so 500 instead of 50 never runs. When something goes wrong, it stops the pump in milliseconds. And it shows up as a device file, so anyone can read its status or test it from a shell.`);

  // ================= 7. Why QNX =================
  s = add('The solution');
  s.addText('Why a real-time OS like QNX', { placeholder: 'title' });
  await row(s, 0.6, 1.6, 6.0, fa.FaSortAmountUp, HEX.accent1, 'Fixed priorities', 'Safety runs at 50. Logs run at 5. Nothing pushes safety aside.', 'priorities');
  await row(s, 0.6, 2.75, 6.0, fa.FaClock, HEX.accent3, 'Kernel timer pulses', 'The kernel wakes the monitor every 1 ms.', 'pulses');
  await row(s, 0.6, 3.9, 6.0, fa.FaCubes, HEX.accent5, 'Microkernel', 'Drivers and apps run apart, so one fault stays contained.', 'microkernel');
  await row(s, 0.6, 5.05, 6.0, fa.FaHospital, HEX.accent4, 'Made for this market', 'QNX already serves medical device makers.', 'market');
  frame(s, 's_42.30.jpg', 7.0, 1.9, 5.7, 3.206, 'Safety goes first: priority lanes');
  s.addNotes(`Why QNX? Because the whole point is timing.

On QNX, priorities mean something. The safety check runs at priority 50, the logger at 5, so nothing can push safety aside. The kernel itself wakes the monitor every millisecond with a timer pulse. The microkernel keeps parts separate, so one fault stays contained. And QNX already serves the medical device market, so this is where a product like this would live.`);

  // ================= 8. How it uses QNX =================
  s = add('The solution');
  s.addText('How it uses QNX 8.0', { placeholder: 'title' });
  frame(s, 'o/s_77.00.jpg', 0.6, 1.6, 6.0, 3.375, 'Architecture: threads, pulses, resource manager on the microkernel');
  const rows = [
    ['QNX feature', 'API', 'File'],
    ['Kernel timer pulses', 'timer_create, SIGEV_PULSE_INIT, MsgReceivePulse', 'src/rt.c'],
    ['Real-time priorities', 'SCHED_FIFO threads (50 / 40 / 10 / 5)', 'src/rt.c, src/main.c'],
    ['Resource manager', 'resmgr_attach, iofunc_* for /dev/infusafe', 'src/control.c'],
    ['Custom boot image', 'mkifs buildfile, boots in QEMU', 'qnx/infusafe.build'],
    ['Lock-free sharing', 'seqlock, never blocks the monitor', 'src/pump_sim.c'],
  ];
  s.addTable(rows.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, color: i === 0 ? HEX.dk1 : HEX.lt1, fill: { color: i === 0 ? HEX.accent3 : (i % 2 ? HEX.dk2 : '15163F') }, fontSize: i === 0 ? 13 : 12, fontFace: 'Calibri' } }))), {
    x: 6.95, y: 1.6, w: 5.8, colW: [1.7, 2.6, 1.5], rowH: 0.56, border: { type: 'solid', color: HEX.dk1, pt: 1 }, valign: 'middle', objectName: 'QNX evidence table',
  });
  s.addText('Cross-compiled with qcc for x86_64 and aarch64le. 30 unit tests pass on QNX.', { x: 0.6, y: 5.3, w: 6.0, h: 0.7, fontSize: 15, color: C.background2, margin: 0, isTextBox: true, objectName: 'build note' });
  s.addNotes(`Here is exactly how it uses QNX, with the files, so you can check the code.

Timer pulses drive the loop: timer_create with a pulse event, and the thread waits in MsgReceivePulse. That is in src/rt.c. The threads run with SCHED_FIFO priorities. The device file is a real QNX resource manager, using resmgr_attach, in src/control.c. And the whole thing boots from my own mkifs image, in qnx/infusafe.build. It is cross-compiled with qcc, and all 30 unit tests pass on QNX.`);

  // ================= 9. Live demo =================
  pres.addSection({ title: 'Demo and results' });
  s = add('Demo and results');
  s.addText('Live on QNX 8.0', { placeholder: 'title' });
  video(s, 'clip_live.mp4', 'poster_live.jpg', 0.6, 1.5, 8.6, 4.8375, 'Live demo video: real QNX 8.0 terminal session');
  await row(s, 9.6, 1.6, 3.3, fa.FaPlay, HEX.accent4, 'Boots', 'Our image, in QEMU.', 'boot');
  await row(s, 9.6, 2.75, 3.3, fa.FaBan, HEX.accent2, 'Refuses 500', 'Over the hard limit.', 'refuse');
  await row(s, 9.6, 3.9, 3.3, fa.FaStopCircle, HEX.accent1, 'Stops', 'Block: 9 ms. Air: 3 ms.', 'stopped');
  await row(s, 9.6, 5.05, 3.3, fa.FaCheckCircle, HEX.accent3, 'Bench', '25 of 25 caught.', 'bench');
  s.addNotes(`Now the real thing, running on QNX 8.0 in QEMU.

[Play the clip.]

It boots from my image. I try to start chemo at 500, and it refuses because that is over the hard limit. At 50 it starts. I block the line, and it stops the pump in about 9 milliseconds. I send in an air bubble, and it stops in under 3. Then the bench injects every fault five times, and every one is caught.`);

  // ================= 10. Results =================
  s = add('Demo and results');
  s.addText('Results: every fault caught', { placeholder: 'title' });
  s.addChart(pres.charts.BAR, [{ name: 'Average time to stop (ms)', labels: ['Air bubble', 'Sensor goes silent', 'Blocked line', 'Free flow'], values: [3.1, 4.4, 9.7, 51.8] }], {
    x: 0.6, y: 1.5, w: 7.4, h: 4.6, barDir: 'bar', chartColors: [HEX.accent1],
    showTitle: true, title: 'Average time to stop the pump (ms), 20 runs each', titleColor: HEX.lt1, titleFontSize: 14, titleFontFace: '+mn-lt',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelColor: HEX.lt1, dataLabelFontSize: 13, dataLabelFontFace: '+mn-lt',
    catAxisLabelColor: HEX.lt2, catAxisLabelFontSize: 13, catAxisLabelFontFace: '+mn-lt', valAxisLabelColor: HEX.lt2, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt',
    valGridLine: { color: '2A2B66', size: 0.5 }, catGridLine: { style: 'none' }, showLegend: false, objectName: 'stop time chart',
  });
  s.addText('100 / 100', { x: 8.5, y: 1.6, w: 4.3, h: 1.3, fontSize: 72, bold: true, color: C.accent4, margin: 0, isTextBox: true, objectName: 'stat 100' });
  s.addText('faults caught, none missed', { x: 8.5, y: 2.9, w: 4.3, h: 0.5, fontSize: 20, color: C.background1, margin: 0, isTextBox: true, objectName: 'stat 100 label' });
  s.addText('< 1 µs', { x: 8.5, y: 3.7, w: 4.3, h: 1.0, fontSize: 54, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: 'stat eval' });
  s.addText('for the safety check itself', { x: 8.5, y: 4.65, w: 4.3, h: 0.5, fontSize: 20, color: C.background1, margin: 0, isTextBox: true, objectName: 'stat eval label' });
  s.addText('Measured on QNX 8.0 in QEMU on a Mac. Free flow waits 50 ms on purpose, to ignore short spikes. An empty bag raises an alarm instantly.', { x: 8.5, y: 5.35, w: 4.3, h: 1.0, fontSize: 13, color: C.background2, margin: 0, isTextBox: true, objectName: 'results note' });
  s.addNotes(`Across 20 runs of each fault, InfuSafe caught 100 out of 100, with none missed. An air bubble is stopped in about 3 milliseconds, a silent sensor in about 4, a blocked line in about 10. Free flow takes about 50 on purpose, so a short spike does not stop the pump for nothing. The safety check itself takes under one microsecond.

These were measured in QEMU on a Mac, which is emulated, so real hardware should be faster.`);

  // ================= 11. Bugs found =================
  s = add('Demo and results');
  s.addText('Three real bugs QNX helped me find', { placeholder: 'title' });
  const bugs = [
    [fa.FaPrint, 'The monitor printed to the console', 'Console writes can block. It delayed safety by up to 12 ms.', 'Now only a priority 5 logger thread prints.'],
    [fa.FaLock, 'A deadlock on one CPU', 'The monitor waited for a half-written reading the sensor could never finish.', 'Now it never waits. It uses the last good reading.'],
    [fa.FaCircle, 'A bubble could slip past', 'A late check missed a bubble 4 times out of 5.', 'Now air is a running total. 20 of 20 caught.'],
  ];
  for (let i = 0; i < 3; i++) {
    const cx = 0.6 + i * 4.1;
    card(s, cx, 1.55, 3.85, 4.75, { name: `bug ${i + 1} card` });
    await dot(s, cx + 0.3, 1.85, 0.7, HEX.accent2, bugs[i][0], `bug ${i + 1}`);
    s.addText([
      { text: bugs[i][1], options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: bugs[i][2], options: { fontSize: 14, color: C.background2 } },
    ], { x: cx + 0.3, y: 2.75, w: 3.25, h: 1.7, valign: 'top', margin: 0, paraSpaceAfter: 6, isTextBox: true, objectName: `bug ${i + 1} problem` });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 0.3, y: 4.6, w: 3.25, h: 1.4, rectRadius: 0.14, fill: { color: C.accent4, transparency: 80 }, line: { color: C.accent4, width: 1 }, objectName: `bug ${i + 1} fix box` });
    s.addText([{ text: 'Fixed: ', options: { bold: true, color: C.accent4 } }, { text: bugs[i][3], options: { color: C.background1 } }], { x: cx + 0.45, y: 4.68, w: 2.95, h: 1.25, fontSize: 14, valign: 'middle', margin: 0, isTextBox: true, objectName: `bug ${i + 1} fix` });
  }
  s.addNotes(`Running on QNX found three real bugs that a normal laptop test did not.

First, the monitor printed its own log lines, and writing to the console can block, so safety was delayed by up to 12 milliseconds. Now only a low-priority logger prints.

Second, a deadlock on one CPU: the monitor outranks the sensor, and it waited for a reading the sensor could never finish. Now it never waits.

Third, a bubble could slip past a late check. Now air is a running total, and it caught 20 out of 20. This is exactly why you test safety code on a real-time OS.`);

  // ================= 12. Meeting the criteria =================
  pres.addSection({ title: 'Wrap up' });
  s = add('Wrap up');
  s.addText('How InfuSafe meets the judging criteria', { placeholder: 'title' });
  const meet = [
    [fa.FaCogs, HEX.accent3, 'Technological Implementation', 'Timer pulses, SCHED_FIFO, a resource manager and a custom boot image. 30 tests pass on QNX.'],
    [fa.FaPalette, HEX.accent2, 'Design', 'A complete flow: drug library, live device, fault bench, one-script build and boot.'],
    [fa.FaHeartbeat, HEX.accent4, 'Potential Impact', 'Targets a documented FDA problem in the medical device market QNX serves.'],
    [fa.FaLightbulb, HEX.accent1, 'Innovation', 'Safety as a separate real-time monitor, testable from any shell through /dev/infusafe.'],
  ];
  for (let i = 0; i < 4; i++) {
    const cx = 0.6 + (i % 2) * 6.15, cy = 1.55 + Math.floor(i / 2) * 2.45;
    card(s, cx, cy, 5.95, 2.25, { name: `meet ${i + 1} card` });
    await dot(s, cx + 0.3, cy + 0.3, 0.7, meet[i][1], meet[i][0], `meet ${i + 1}`);
    s.addText([
      { text: meet[i][2], options: { bold: true, fontSize: 19, color: C.background1, breakLine: true } },
      { text: meet[i][3], options: { fontSize: 15, color: C.background2 } },
    ], { x: cx + 1.25, y: cy + 0.3, w: 4.45, h: 1.75, valign: 'top', margin: 0, paraSpaceAfter: 6, isTextBox: true, objectName: `meet ${i + 1} text` });
  }
  s.addNotes(`To sum up against the four criteria.

Technology: it is built on real QNX features, timer pulses, real-time priorities, a resource manager and a custom boot image, and the tests pass on QNX.

Design: it is a complete product, from the drug library to the live device and a one-script build.

Impact: it targets a problem the FDA has documented, in a market QNX already serves.

Innovation: safety lives in its own real-time monitor that you can test from any shell.`);

  // ================= 13. Next and thanks =================
  s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'Wrap up' });
  s.addText('What comes next', { x: 0.7, y: 0.9, w: 6, h: 0.8, fontSize: 36, bold: true, color: C.background1, margin: 0, isTextBox: true, objectName: 'next title' });
  s.addText([
    { text: 'Real pump hardware on a Raspberry Pi 4 running QNX', options: { bullet: true, breakLine: true } },
    { text: 'Monitor and pump as separate processes, talking by message passing', options: { bullet: true, breakLine: true } },
    { text: 'A signed drug library the pharmacy can update', options: { bullet: true, breakLine: true } },
    { text: 'Toward a medical safety certification path', options: { bullet: true } },
  ], { x: 0.7, y: 1.9, w: 5.8, h: 2.6, fontSize: 18, color: C.background1, paraSpaceAfter: 10, margin: 0, valign: 'top', isTextBox: true, objectName: 'next steps' });
  s.addText('Thank you', { x: 0.7, y: 4.85, w: 5.8, h: 0.8, fontSize: 40, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: 'thanks' });
  s.addText('github.com/KushagraRishi/infusafe-qnx', { x: 0.7, y: 5.7, w: 5.8, h: 0.5, fontSize: 18, color: C.accent3, margin: 0, isTextBox: true, objectName: 'repo link', hyperlink: { url: 'https://github.com/KushagraRishi/infusafe-qnx' } });
  frame(s, 'o/s_107.80.jpg', 6.75, 1.6, 6.0, 3.375, 'InfuSafe end card');
  s.addNotes(`Next, I want to run it on real pump hardware on a Raspberry Pi 4 with QNX, split the monitor and the pump into separate processes that talk through QNX message passing, add a signed drug library, and look at a safety certification path.

Thank you. The code, build steps and tests are all on GitHub. I'm happy to take questions.`);

  const out = path.join(__dirname, 'InfuSafe.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('wrote', out);
})();
