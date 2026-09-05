const fs = require("fs");
const path = require("path");

const sampleRate = 44100;
const output = path.join(__dirname, "assets", "audio");
fs.mkdirSync(output, { recursive: true });

function writeWav(name, samples) {
  const dataLength = samples.length * 2;
  const file = Buffer.alloc(44 + dataLength);
  file.write("RIFF", 0);
  file.writeUInt32LE(36 + dataLength, 4);
  file.write("WAVEfmt ", 8);
  file.writeUInt32LE(16, 16);
  file.writeUInt16LE(1, 20);
  file.writeUInt16LE(1, 22);
  file.writeUInt32LE(sampleRate, 24);
  file.writeUInt32LE(sampleRate * 2, 28);
  file.writeUInt16LE(2, 32);
  file.writeUInt16LE(16, 34);
  file.write("data", 36);
  file.writeUInt32LE(dataLength, 40);
  samples.forEach((sample, index) => file.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), 44 + index * 2));
  fs.writeFileSync(path.join(output, name), file);
}

function violin(name, notes) {
  const duration = 3.25;
  const samples = Array.from({ length: Math.floor(sampleRate * duration) }, (_, index) => {
    const time = index / sampleRate;
    const noteIndex = Math.min(notes.length - 1, Math.floor(time / .72));
    const localTime = time - noteIndex * .72;
    const frequency = notes[noteIndex] * (1 + .004 * Math.sin(time * Math.PI * 10));
    const envelope = Math.min(1, localTime / .08) * Math.max(0, 1 - Math.max(0, localTime - .51) / .21);
    const voice = Math.sin(Math.PI * 2 * frequency * time) + .25 * Math.sin(Math.PI * 2 * frequency * 2 * time) + .08 * Math.sin(Math.PI * 2 * frequency * 3 * time);
    return voice * envelope * .16;
  });
  writeWav(name, samples);
}

function drums(name, bpm, accentEvery) {
  const duration = 3.25;
  const beatLength = 60 / bpm;
  const samples = Array.from({ length: Math.floor(sampleRate * duration) }, (_, index) => {
    const time = index / sampleRate;
    const beat = Math.floor(time / beatLength);
    const beatTime = time - beat * beatLength;
    const accent = beat % accentEvery === 0;
    const kick = beatTime < .18 ? Math.sin(Math.PI * 2 * (118 - beatTime * 420) * beatTime) * Math.exp(-beatTime * 24) * (accent ? .7 : .48) : 0;
    const noise = Math.sin(index * 12.9898 + beat * 78.233) * .5 + Math.sin(index * 78.233) * .5;
    const snare = beat % 2 === 1 && beatTime < .13 ? noise * Math.exp(-beatTime * 30) * .3 : 0;
    const hat = beatTime < .045 ? noise * Math.exp(-beatTime * 80) * .09 : 0;
    return kick + snare + hat;
  });
  writeWav(name, samples);
}

function bird(name, pitches) {
  const duration = 3.25;
  const chirpLength = .19;
  const chirpGap = .39;
  const samples = Array.from({ length: Math.floor(sampleRate * duration) }, (_, index) => {
    const time = index / sampleRate;
    const chirp = Math.floor(time / chirpGap);
    const localTime = time - chirp * chirpGap;
    if (localTime > chirpLength) return 0;
    const pitch = pitches[chirp % pitches.length];
    const frequency = pitch * (1 + localTime * 1.25);
    const envelope = Math.sin((localTime / chirpLength) * Math.PI) ** 1.8;
    const voice = Math.sin(Math.PI * 2 * frequency * localTime) + .32 * Math.sin(Math.PI * 2 * frequency * 2 * localTime);
    return voice * envelope * .17;
  });
  writeWav(name, samples);
}

bird("bird-garden.wav", [1380, 1640, 1510, 1780]);
bird("bird-morning.wav", [1720, 1460, 1860, 1580]);
bird("bird-mystery.wav", [1550, 1810, 1690, 1920]);
drums("drums-festival.wav", 108, 4);
drums("drums-march.wav", 122, 2);
drums("drums-mystery.wav", 116, 4);
