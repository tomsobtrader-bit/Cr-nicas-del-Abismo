// ─────────────────────────────────────────────────────────────────────────────
// audiosystem.js — Sistema de audio procedural para Crónicas del Abismo
// Todo generado con Web Audio API. Sin archivos externos.
// ─────────────────────────────────────────────────────────────────────────────

class AudioSystem {

    constructor() {
        this._ctx         = null
        this._masterGain  = null
        this._musicGain   = null
        this._sfxGain     = null

        this._lobbyNodes  = []   // nodos activos de la música de lobby
        this._battleNodes = []   // nodos activos de la música de batalla
        this._currentMusic = null // "lobby" | "battle" | null

        this._musicVolume = 0.45
        this._sfxVolume   = 0.7

        this._initialized = false
        this._fadeTime    = 2.0  // segundos para crossfade
    }

    // ── Inicializar contexto (requiere gesto del usuario) ─────────────────────
    _init() {
        if (this._initialized) return true
        try {
            this._ctx        = new (window.AudioContext || window.webkitAudioContext)()
            this._masterGain = this._ctx.createGain()
            this._musicGain  = this._ctx.createGain()
            this._sfxGain    = this._ctx.createGain()

            this._musicGain.gain.value = this._musicVolume
            this._sfxGain.gain.value   = this._sfxVolume

            this._musicGain.connect(this._masterGain)
            this._sfxGain.connect(this._masterGain)
            this._masterGain.connect(this._ctx.destination)

            this._initialized = true
            return true
        } catch(e) {
            console.warn("AudioSystem: Web Audio API no disponible", e)
            return false
        }
    }

    _resume() {
        if (this._ctx && this._ctx.state === "suspended") {
            this._ctx.resume()
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÚSICA DE LOBBY — atmósfera oscura y lenta, cuerdas + pad etéreo
    // ═══════════════════════════════════════════════════════════════════════════

    playLobbyMusic() {
        if (!this._init()) return
        this._resume()
        if (this._currentMusic === "lobby") return
        this._stopAllMusic()
        this._currentMusic = "lobby"

        const ctx = this._ctx
        const out = this._musicGain

        // Fade in del gain de música
        out.gain.cancelScheduledValues(ctx.currentTime)
        out.gain.setValueAtTime(0, ctx.currentTime)
        out.gain.linearRampToValueAtTime(this._musicVolume, ctx.currentTime + this._fadeTime)

        this._lobbyNodes = []

        // ── 1. Pad oscuro y etéreo (ondas seno detuneadas) ──────────────────
        const padFreqs = [65.41, 98.0, 130.81, 155.56]  // C2, G2, C3, Eb3
        padFreqs.forEach((freq, i) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()

            osc.type = "sine"
            osc.frequency.value = freq + (i * 0.3)  // ligero detune por voz
            osc.detune.value = (i % 2 === 0) ? -8 : 8

            filt.type = "lowpass"
            filt.frequency.value = 600
            filt.Q.value = 0.8

            gain.gain.value = 0.06

            // LFO de volumen lento (respiración)
            const lfo = ctx.createOscillator()
            const lfoGain = ctx.createGain()
            lfo.frequency.value = 0.07 + i * 0.015
            lfoGain.gain.value = 0.025
            lfo.connect(lfoGain)
            lfoGain.connect(gain.gain)
            lfo.start()

            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start()

            this._lobbyNodes.push(osc, lfo, gain, filt, lfoGain)
        })

        // ── 2. Cuerda baja pulsada (arpegio lento en C menor) ────────────────
        const arpeggioNotes = [65.41, 77.78, 98.0, 103.83, 130.81]  // C2 Eb2 G2 Ab2 C3
        let step = 0
        const playArpNote = () => {
            if (this._currentMusic !== "lobby") return
            const freq = arpeggioNotes[step % arpeggioNotes.length]
            step++

            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()

            osc.type = "triangle"
            osc.frequency.value = freq
            filt.type = "bandpass"
            filt.frequency.value = freq * 2
            filt.Q.value = 2

            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2)

            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start()
            osc.stop(ctx.currentTime + 2.5)

            const delay = 1800 + Math.random() * 600
            const tid = setTimeout(playArpNote, delay)
            this._lobbyNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playArpNote, 400)

        // ── 3. Dron de bajo profundo ──────────────────────────────────────────
        const drone = ctx.createOscillator()
        const droneGain = ctx.createGain()
        const droneFilt = ctx.createBiquadFilter()
        drone.type = "sawtooth"
        drone.frequency.value = 32.7  // C1
        droneFilt.type = "lowpass"
        droneFilt.frequency.value = 120
        droneGain.gain.value = 0.04
        drone.connect(droneFilt)
        droneFilt.connect(droneGain)
        droneGain.connect(out)
        drone.start()
        this._lobbyNodes.push(drone, droneGain, droneFilt)

        // ── 4. Campana esporádica ─────────────────────────────────────────────
        const playBell = () => {
            if (this._currentMusic !== "lobby") return
            const bellFreqs = [523.25, 622.25, 783.99, 1046.5]  // C5 Eb5 G5 C6
            const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)]

            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5)
            osc.connect(gain)
            gain.connect(out)
            osc.start()
            osc.stop(ctx.currentTime + 4)

            const tid = setTimeout(playBell, 4000 + Math.random() * 5000)
            this._lobbyNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playBell, 2000 + Math.random() * 2000)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MÚSICA DE BATALLA — tensa, rítmica, oscura
    // ═══════════════════════════════════════════════════════════════════════════

    playBattleMusic() {
        if (!this._init()) return
        this._resume()
        if (this._currentMusic === "battle") return
        this._stopAllMusic()
        this._currentMusic = "battle"

        const ctx = this._ctx
        const out = this._musicGain

        out.gain.cancelScheduledValues(ctx.currentTime)
        out.gain.setValueAtTime(0, ctx.currentTime)
        out.gain.linearRampToValueAtTime(this._musicVolume, ctx.currentTime + this._fadeTime)

        this._battleNodes = []

        const BPM      = 88
        const beat     = 60 / BPM          // ~0.682s
        const bar      = beat * 4

        // ── 1. Pad oscuro de fondo (igual que lobby pero más tenso) ──────────
        const padFreqs = [55.0, 82.41, 110.0, 130.81]  // A1 E2 A2 C3
        padFreqs.forEach((freq, i) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()
            osc.type = "sawtooth"
            osc.frequency.value = freq
            osc.detune.value = i % 2 === 0 ? -6 : 6
            filt.type = "lowpass"
            filt.frequency.value = 350
            gain.gain.value = 0.03
            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start()
            this._battleNodes.push(osc, gain, filt)
        })

        // ── 2. Bombo (kick) rítmico ───────────────────────────────────────────
        const playKick = () => {
            if (this._currentMusic !== "battle") return
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.setValueAtTime(180, ctx.currentTime)
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15)
            gain.gain.setValueAtTime(0.55, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
            osc.connect(gain)
            gain.connect(out)
            osc.start()
            osc.stop(ctx.currentTime + 0.3)
            const tid = setTimeout(playKick, beat * 1000)
            this._battleNodes.push({ _isTimer: true, _tid: tid })
        }
        playKick()

        // ── 3. Redoblante (snare) en tiempos 2 y 4 ───────────────────────────
        let snareCount = 0
        const playSnare = () => {
            if (this._currentMusic !== "battle") return
            snareCount++
            if (snareCount % 2 === 0) {
                const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate)
                const data = buf.getChannelData(0)
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5)
                }
                const src  = ctx.createBufferSource()
                const gain = ctx.createGain()
                const filt = ctx.createBiquadFilter()
                filt.type = "highpass"
                filt.frequency.value = 1800
                src.buffer = buf
                gain.gain.setValueAtTime(0.25, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
                src.connect(filt)
                filt.connect(gain)
                gain.connect(out)
                src.start()
            }
            const tid = setTimeout(playSnare, beat * 1000)
            this._battleNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playSnare, beat * 1000)

        // ── 4. Hi-hat en corcheas ─────────────────────────────────────────────
        let hatCount = 0
        const playHat = () => {
            if (this._currentMusic !== "battle") return
            hatCount++
            const vol = hatCount % 2 === 0 ? 0.07 : 0.04  // acento en tiempos fuertes
            const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
            const data = buf.getChannelData(0)
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
            }
            const src  = ctx.createBufferSource()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()
            filt.type = "highpass"
            filt.frequency.value = 8000
            src.buffer = buf
            gain.gain.value = vol
            src.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            src.start()
            const tid = setTimeout(playHat, (beat / 2) * 1000)
            this._battleNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playHat, 100)

        // ── 5. Bajo pulsado (patrón oscuro) ──────────────────────────────────
        const bassLine = [55.0, 55.0, 65.41, 55.0, 49.0, 55.0, 58.27, 55.0]  // A E C A G A Bb A
        let bassStep = 0
        const playBass = () => {
            if (this._currentMusic !== "battle") return
            const freq = bassLine[bassStep % bassLine.length]
            bassStep++
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()
            osc.type = "sawtooth"
            osc.frequency.value = freq
            filt.type = "lowpass"
            filt.frequency.value = 280
            gain.gain.setValueAtTime(0.18, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beat * 0.85)
            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start()
            osc.stop(ctx.currentTime + beat)
            const tid = setTimeout(playBass, beat * 1000)
            this._battleNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playBass, 200)

        // ── 6. Melodía de tensión (cada 2 compases) ───────────────────────────
        const melodyNotes = [
            [220.0, beat * 0.5],
            [207.65, beat * 0.5],
            [196.0, beat],
            [185.0, beat * 1.5],
            [220.0, beat * 0.5],
            [246.94, beat],
            [220.0, beat * 2],
        ]
        let melStep = 0
        const playMelody = () => {
            if (this._currentMusic !== "battle") return
            const [freq, dur] = melodyNotes[melStep % melodyNotes.length]
            melStep++
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()
            osc.type = "triangle"
            osc.frequency.value = freq
            filt.type = "bandpass"
            filt.frequency.value = freq * 1.5
            filt.Q.value = 3
            gain.gain.setValueAtTime(0, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.04)
            gain.gain.setValueAtTime(0.06, ctx.currentTime + dur * 0.7)
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur)
            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start()
            osc.stop(ctx.currentTime + dur + 0.05)
            const tid = setTimeout(playMelody, dur * 1000)
            this._battleNodes.push({ _isTimer: true, _tid: tid })
        }
        setTimeout(playMelody, bar * 2 * 1000)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DETENER MÚSICA
    // ═══════════════════════════════════════════════════════════════════════════

    _stopAllMusic() {
        const ctx = this._ctx
        if (!ctx) return

        // Fade out
        const gain = this._musicGain
        if (gain) {
            gain.gain.cancelScheduledValues(ctx.currentTime)
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
        }

        // Detener osciladores
        const stopNodes = (list) => {
            list.forEach(node => {
                if (!node) return
                if (node._isTimer) {
                    clearTimeout(node._tid)
                } else if (typeof node.stop === "function") {
                    try { node.stop(ctx.currentTime + 0.9) } catch(e) {}
                } else if (typeof node.disconnect === "function") {
                    setTimeout(() => { try { node.disconnect() } catch(e) {} }, 1000)
                }
            })
            list.length = 0
        }

        stopNodes(this._lobbyNodes)
        stopNodes(this._battleNodes)
        this._currentMusic = null
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SFX — TROPA DERROTADA
    // Sonido oscuro, "death thud" + ruido descendente
    // ═══════════════════════════════════════════════════════════════════════════

    playTroopDeath() {
        if (!this._init()) return
        this._resume()
        const ctx = this._ctx
        const out = this._sfxGain

        // 1. Golpe sordo (bajo)
        const kick = ctx.createOscillator()
        const kickGain = ctx.createGain()
        kick.type = "sine"
        kick.frequency.setValueAtTime(120, ctx.currentTime)
        kick.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.25)
        kickGain.gain.setValueAtTime(0.7, ctx.currentTime)
        kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        kick.connect(kickGain)
        kickGain.connect(out)
        kick.start()
        kick.stop(ctx.currentTime + 0.35)

        // 2. Ruido descendente (espíritu que sale)
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.8)
        }
        const noise = ctx.createBufferSource()
        const nFilt = ctx.createBiquadFilter()
        const nGain = ctx.createGain()
        nFilt.type = "bandpass"
        nFilt.frequency.setValueAtTime(1200, ctx.currentTime)
        nFilt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4)
        nFilt.Q.value = 4
        nGain.gain.setValueAtTime(0.2, ctx.currentTime)
        nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        noise.buffer = buf
        noise.connect(nFilt)
        nFilt.connect(nGain)
        nGain.connect(out)
        noise.start()

        // 3. Tono espectral descendente
        const ghost = ctx.createOscillator()
        const ghostGain = ctx.createGain()
        ghost.type = "sine"
        ghost.frequency.setValueAtTime(440, ctx.currentTime + 0.05)
        ghost.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5)
        ghostGain.gain.setValueAtTime(0, ctx.currentTime)
        ghostGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05)
        ghostGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        ghost.connect(ghostGain)
        ghostGain.connect(out)
        ghost.start()
        ghost.stop(ctx.currentTime + 0.55)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SFX — VICTORIA / AVANCE DE NIVEL
    // Fanfarria épica de trompetas y cuerda ascendente
    // ═══════════════════════════════════════════════════════════════════════════

    playVictoryFanfare() {
        if (!this._init()) return
        this._resume()
        const ctx = this._ctx
        const out = this._sfxGain

        // Notas de la fanfarria: C4 E4 G4 C5 (acorde de C mayor ascendente)
        const fanfare = [
            { freq: 261.63, t: 0,    dur: 0.18 },  // C4
            { freq: 329.63, t: 0.18, dur: 0.18 },  // E4
            { freq: 392.0,  t: 0.36, dur: 0.18 },  // G4
            { freq: 523.25, t: 0.54, dur: 0.55 },  // C5 largo
            { freq: 659.25, t: 0.62, dur: 0.45 },  // E5 (armonía)
            { freq: 784.0,  t: 0.70, dur: 0.35 },  // G5 (armonía alta)
        ]

        fanfare.forEach(({ freq, t, dur }) => {
            // Voz de trompeta (sawtooth + filtro)
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()

            osc.type = "sawtooth"
            osc.frequency.value = freq

            // Ligero portamento hacia arriba al inicio
            osc.frequency.setValueAtTime(freq * 0.97, ctx.currentTime + t)
            osc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + t + 0.04)

            filt.type = "bandpass"
            filt.frequency.value = freq * 2.5
            filt.Q.value = 2.5

            gain.gain.setValueAtTime(0, ctx.currentTime + t)
            gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03)
            gain.gain.setValueAtTime(0.18, ctx.currentTime + t + dur * 0.7)
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + dur)

            osc.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            osc.start(ctx.currentTime + t)
            osc.stop(ctx.currentTime + t + dur + 0.05)
        })

        // Redoble de tambor al inicio
        const drumTime = ctx.currentTime
        for (let i = 0; i < 4; i++) {
            const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate)
            const data = buf.getChannelData(0)
            for (let j = 0; j < data.length; j++) {
                data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / data.length, 1.2)
            }
            const src  = ctx.createBufferSource()
            const gain = ctx.createGain()
            const filt = ctx.createBiquadFilter()
            filt.type = "highpass"
            filt.frequency.value = 1200
            src.buffer = buf
            gain.gain.value = 0.15 + i * 0.04
            src.connect(filt)
            filt.connect(gain)
            gain.connect(out)
            src.start(drumTime + i * 0.085)
        }

        // Campanada final brillante
        setTimeout(() => {
            const bell = ctx.createOscillator()
            const bellGain = ctx.createGain()
            bell.type = "sine"
            bell.frequency.value = 1046.5  // C6
            bellGain.gain.setValueAtTime(0.35, ctx.currentTime)
            bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8)
            bell.connect(bellGain)
            bellGain.connect(out)
            bell.start()
            bell.stop(ctx.currentTime + 2)
        }, 980)

        // Segundo campanada (quinta)
        setTimeout(() => {
            const bell2 = ctx.createOscillator()
            const b2Gain = ctx.createGain()
            bell2.type = "sine"
            bell2.frequency.value = 784.0  // G5
            b2Gain.gain.setValueAtTime(0.2, ctx.currentTime)
            b2Gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
            bell2.connect(b2Gain)
            b2Gain.connect(out)
            bell2.start()
            bell2.stop(ctx.currentTime + 1.6)
        }, 1050)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SFX — ATAQUE (opcional, sutil)
    // ═══════════════════════════════════════════════════════════════════════════

    playAttack() {
        if (!this._init()) return
        this._resume()
        const ctx = this._ctx
        const out = this._sfxGain

        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 0.5)
        }
        const src  = ctx.createBufferSource()
        const filt = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        filt.type = "bandpass"
        filt.frequency.value = 900
        filt.Q.value = 1.5
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        src.buffer = buf
        src.connect(filt)
        filt.connect(gain)
        gain.connect(out)
        src.start()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SFX — CARTA JUGADA (whoosh suave)
    // ═══════════════════════════════════════════════════════════════════════════

    playCardPlay() {
        if (!this._init()) return
        this._resume()
        const ctx = this._ctx
        const out = this._sfxGain

        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        const filt = ctx.createBiquadFilter()
        osc.type = "sine"
        osc.frequency.setValueAtTime(320, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15)
        filt.type = "lowpass"
        filt.frequency.value = 800
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.connect(filt)
        filt.connect(gain)
        gain.connect(out)
        osc.start()
        osc.stop(ctx.currentTime + 0.22)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SFX — GOLPE AL LÍDER (impacto grave)
    // ═══════════════════════════════════════════════════════════════════════════

    playLeaderHit() {
        if (!this._init()) return
        this._resume()
        const ctx = this._ctx
        const out = this._sfxGain

        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(90, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.35)
        gain.gain.setValueAtTime(0.5, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.connect(gain)
        gain.connect(out)
        osc.start()
        osc.stop(ctx.currentTime + 0.45)

        // Crack agudo encima
        const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5)
        }
        const src  = ctx.createBufferSource()
        const filt = ctx.createBiquadFilter()
        const g2   = ctx.createGain()
        filt.type = "highpass"
        filt.frequency.value = 3000
        g2.gain.value = 0.22
        src.buffer = buf
        src.connect(filt)
        filt.connect(g2)
        g2.connect(out)
        src.start()
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTROL DE VOLUMEN
    // ═══════════════════════════════════════════════════════════════════════════

    setMusicVolume(v) {
        this._musicVolume = Math.max(0, Math.min(1, v))
        if (this._musicGain) {
            this._musicGain.gain.setValueAtTime(this._musicVolume, this._ctx.currentTime)
        }
    }

    setSfxVolume(v) {
        this._sfxVolume = Math.max(0, Math.min(1, v))
        if (this._sfxGain) {
            this._sfxGain.gain.setValueAtTime(this._sfxVolume, this._ctx.currentTime)
        }
    }

    stopMusic() {
        this._stopAllMusic()
    }
}

// Instancia global singleton
export const audio = new AudioSystem()