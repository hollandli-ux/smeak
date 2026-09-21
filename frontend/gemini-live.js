const LIVE_RESP = {
  TEXT: "TEXT",
  AUDIO: "AUDIO",
  SETUP_COMPLETE: "SETUP_COMPLETE",
  INTERRUPTED: "INTERRUPTED",
  TURN_COMPLETE: "TURN_COMPLETE",
  TOOL_CALL: "TOOL_CALL",
  ERROR: "ERROR",
  INPUT_TRANSCRIPTION: "INPUT_TRANSCRIPTION",
  OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",
  SPEECH_START: "SPEECH_START",
  SPEECH_END: "SPEECH_END",
  GOAWAY: "GOAWAY",
  RAW: "RAW",
  CLOSE: "CLOSE",
};

function parseLiveMessage(data) {
  const responses = [];
  const serverContent = data?.serverContent;
  const parts = serverContent?.modelTurn?.parts;
  try {
    if (data?.setupComplete) {
      responses.push({ type: LIVE_RESP.SETUP_COMPLETE, data: "", endOfTurn: false });
      return responses;
    }
    if (data?.toolCall) {
      responses.push({ type: LIVE_RESP.TOOL_CALL, data: data.toolCall, endOfTurn: false });
      return responses;
    }
    if (parts?.length) {
      for (const part of parts) {
        if (part.inlineData) {
          responses.push({ type: LIVE_RESP.AUDIO, data: part.inlineData.data, endOfTurn: false });
        } else if (part.text) {
          responses.push({ type: LIVE_RESP.TEXT, data: part.text, endOfTurn: false });
        }
      }
    }
    if (serverContent?.inputTranscription) {
      responses.push({
        type: LIVE_RESP.INPUT_TRANSCRIPTION,
        data: { text: serverContent.inputTranscription.text || "", finished: !!serverContent.inputTranscription.finished },
        endOfTurn: false,
      });
    }
    if (serverContent?.outputTranscription) {
      responses.push({
        type: LIVE_RESP.OUTPUT_TRANSCRIPTION,
        data: { text: serverContent.outputTranscription.text || "", finished: !!serverContent.outputTranscription.finished, raw: JSON.stringify(serverContent).slice(0, 300) },
        endOfTurn: false,
      });
    }
    if (serverContent?.interrupted) {
      responses.push({ type: LIVE_RESP.INTERRUPTED, data: "", endOfTurn: false });
    }
    if (serverContent?.turnComplete) {
      responses.push({ type: LIVE_RESP.TURN_COMPLETE, data: "", endOfTurn: true });
    }
    if (data?.voiceActivity) {
      if (data.voiceActivity.type === "ACTIVITY_START") {
        responses.push({ type: LIVE_RESP.SPEECH_START, data: "", endOfTurn: false });
      } else if (data.voiceActivity.type === "ACTIVITY_END") {
        responses.push({ type: LIVE_RESP.SPEECH_END, data: "", endOfTurn: false });
      }
    }
    if (data?.error) {
      responses.push({ type: LIVE_RESP.ERROR, data: (data.error && (data.error.message || JSON.stringify(data.error))) || "server error", endOfTurn: true });
    }
    if (data?.goAway) {
      responses.push({ type: LIVE_RESP.GOAWAY, data: JSON.stringify(data.goAway), endOfTurn: false });
    }
    const ignorable =
      data?.sessionResumptionUpdate ||
      data?.generationComplete ||
      (serverContent && !serverContent.modelTurn && !serverContent.inputTranscription &&
       !serverContent.outputTranscription && !serverContent.interrupted && !serverContent.turnComplete);
    if (responses.length === 0 && data && Object.keys(data).length && !ignorable) {
      responses.push({ type: LIVE_RESP.RAW, data: JSON.stringify(data).slice(0, 300), endOfTurn: false });
    }
  } catch (err) {
    console.error("parseLiveMessage error:", err, data);
  }
  return responses;
}

class GeminiLiveClient {
  constructor({ token, apiKey, proxyUrl, model, voice = "Aoede", systemInstruction = "", temperature = 1.0, vadMs = 0, onEvent }) {
    this.token = token;
    this.apiKey = apiKey;
    this.proxyUrl = proxyUrl || null;
    this.modelName = model;
    this.model = `models/${model}`;
    this.voice = voice;
    this.systemInstruction = systemInstruction;
    this.temperature = temperature;
    this.vadMs = vadMs;
    this.onEvent = onEvent || (() => {});
    this.ws = null;

    const base = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.";
    if (this.proxyUrl) this.serviceUrl = this.proxyUrl;
    else if (token) this.serviceUrl = `${base}v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token)}`;
    else this.serviceUrl = `${base}v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(apiKey)}`;
  }

  connect() {
    return new Promise((resolve, reject) => {
      let settled = false;
      this.ws = new WebSocket(this.serviceUrl);
      this.ws.onopen = () => {
        this._sendSetup();
        if (!settled) { settled = true; resolve(); }
      };
      this.ws.onmessage = async (ev) => {
        let text;
        if (ev.data instanceof Blob) text = await ev.data.text();
        else if (ev.data instanceof ArrayBuffer) text = new TextDecoder().decode(ev.data);
        else text = ev.data;
        let json;
        try { json = JSON.parse(text); } catch { return; }
        for (const r of parseLiveMessage(json)) this._emit(r);
      };
      this.ws.onerror = () => {
        if (!settled) { settled = true; reject(new Error("连接失败：请检查网络 / API Key 是否有效")); }
        this._emit({ type: LIVE_RESP.ERROR, data: "连接失败", endOfTurn: false });
      };
      this.ws.onclose = (ev) => {
        const reason = ev && ev.reason ? " " + ev.reason : "";
        this._emit({ type: LIVE_RESP.CLOSE, data: "code=" + (ev && ev.code != null ? ev.code : "?") + reason, endOfTurn: false });
      };
    });
  }

  _emit(r) { try { this.onEvent(r); } catch (e) { console.error(e); } }

  _sendSetup() {
    if (this.proxyUrl) {
      this._send(JSON.stringify({
        kind: "start",
        config: {
          model: this.modelName,
          voice: this.voice,
          vadMs: this.vadMs,
          temperature: this.temperature,
          systemInstruction: this.systemInstruction,
        },
      }));
      return;
    }
    const setup = {
      model: this.model,
      generationConfig: {
        responseModalities: ["AUDIO"],
        temperature: this.temperature,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voice } },
        },
      },
      systemInstruction: { parts: [{ text: this.systemInstruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    setup.realtimeInputConfig = {
      automaticActivityDetection: {
        disabled: false,
        silenceDurationMs: this.vadMs > 0 ? this.vadMs : 900,
        prefixPaddingMs: 300,
        endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
        startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
      },
      activityHandling: "ACTIVITY_HANDLING_UNSPECIFIED",
    };
    this._send(JSON.stringify({ setup }));
  }

  sendAudioBase64(b64) {
    this._send(JSON.stringify({ realtimeInput: { audio: { mimeType: "audio/pcm", data: b64 } } }));
  }

  sendText(text) {
    this._send(JSON.stringify({ realtimeInput: { text } }));
  }

  askModelToRespond() {
    this._send(JSON.stringify({ responseCreate: {} }));
  }

  _send(s) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(s); }

  close() { try { if (this.ws) this.ws.close(); } catch (e) {  } this.ws = null; }
}
