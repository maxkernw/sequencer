
import { fromEvent, interval, merge, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import kick from './sounds/kick.mp3';
import snare from './sounds/snare.mp3';
import hihat from './sounds/hihat.mp3';

const audioContext = new AudioContext()

const range = document.querySelector('#bpm') as HTMLInputElement;
const grids = document.querySelector('#grids') as HTMLInputElement;

const container1 = document.querySelector('.container-1');
const drumContainer = document.querySelector('.mac-drum');
const synthContainer = document.querySelector('.synth-container');
const value = document.querySelector('span');

const range$ = fromEvent<Event>(range, 'change');
const grids$ = fromEvent<Event>(grids, 'change');
const pitch = () => Math.floor(Math.random() * (12 - -4) + -4)

const bars = 12
let count = 0;

const subscriptions: Array<Subscription> = [];

const create = (type: string, className?: string, id?: string): HTMLElement => {
    const element = document.createElement(type);
    element.className = className;
    element.id = id;
    return element;
}
const generateGrid = (target: Element) => {
    for (let x = 0; x <= bars - 1; x++) {

        const div = create('div', `bar-${x + 1} mute`, 'bar');

        const observable = merge(fromEvent(div, 'mouseover'), fromEvent(div, 'click'));

        const sub = observable.subscribe((e: PointerEvent) => {
            if (e.buttons == 1 || e.buttons == 3 || e.type === 'click') {
                const target = e.target as HTMLDivElement;
                playNote(div, { bpm: 120, ms: 1000 })

                if (target.classList.contains('mute')) {
                    return target.classList.remove('mute');
                }
                target.classList.add('mute');
            }
        });
        subscriptions.push(sub);

        target.appendChild(div);

    }
}

const generateDrums = () => {
    for (let x = 0; x <= 2; x++) {
        const div = create('div', `drum-container-${x}`, 'drum-container');
        generateGrid(div);

        drumContainer.appendChild(div);
    }
}

grids$.subscribe((e) => {
    document.querySelectorAll('#container').forEach(e => synthContainer.removeChild(e));

    const target = e.target as HTMLInputElement;
    for (let x = 0; x <= parseInt(target.value); x++) {
        const div = create('div', `container-${x}`, 'container');

        generateGrid(div);
        synthContainer.appendChild(div);
    }

});

range$.pipe(switchMap((e) => {
    const target = e.target as HTMLInputElement;
    value.innerText = target.value;
    const bpmValue = parseInt(target.value);
    return interval(60000 / bpmValue).pipe(map(() => ({
        bpm: bpmValue,
        ms: 60000 / bpmValue,
    })))
})).subscribe(e => {
    count = count += 1;
    if (count === 13) {
        count = 1;
    }

    const actives = document.querySelectorAll('.active');

    actives.forEach((active: HTMLElement) => {
        if (active) {
            active.classList.remove('active');
            active.style.backgroundColor = '';
        }
    })

    const divs = document.querySelectorAll(`.bar-${count}`);

    divs.forEach((div: HTMLElement) => {
        div.classList.add('active');
        div.style.backgroundColor = '#e9c46a';

        if (!div.classList.contains('mute')) {
            playNote(div, e);
        }
    })

})

const playDrum = async (delay: number, file: string, duration: number) => {
    const startTime = audioContext.currentTime + delay
    const endTime = startTime + duration

    const source = audioContext.createBufferSource();
    const audioBuffer = await fetch(file)
        .then(res => res.arrayBuffer())
        .then(ArrayBuffer => audioContext.decodeAudioData(ArrayBuffer));

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(startTime);
    source.stop(endTime);
}



const play = (delay: number, pitch: number, duration: number): void => {
    const startTime = audioContext.currentTime + delay
    const endTime = startTime + duration

    const oscillator = audioContext.createOscillator();
    const g = audioContext.createGain();

    g.gain.value = 0.5;
    g.connect(audioContext.destination);

    oscillator.connect(g)

    oscillator.type = 'sine'
    oscillator.detune.value = pitch * 100

    oscillator.start(startTime)
    oscillator.stop(endTime)
}


const playNote = (div: HTMLElement, e: { bpm: number; ms: number; }) => {
    if (div.parentElement.classList.contains('drum-container-0')) {
        playDrum(0, hihat, 3000);
    }
    else if (div.parentElement.classList.contains('drum-container-1')) {
        playDrum(0, snare, 3000);
    }
    else if (div.parentElement.classList.contains('drum-container-2')) {
        playDrum(0, kick, 3000);
    }
    else {
        play(0, pitch(), e.ms / 1000);
    }
}



generateDrums();
generateGrid(container1);


range.dispatchEvent(new Event('change'));