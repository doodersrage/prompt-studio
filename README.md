# Prompt Studio

**Prompt, image, video and audio tools for ComfyUI**, running locally: Generate, Prompt Editor, Image → Prompt, Video, Variations, Compose, ControlNet, Inpaint / Outpaint, Refine, Audio, Mesh, the workflow editor, Gallery and Queue.

Prompt Studio is the classic toolset of [Castcut](https://github.com/doodersrage/castcut), which grew into a character-film app. Both apps share one core, published as [`prompt-studio-core`](https://www.npmjs.com/package/prompt-studio-core); this repository is the app around it.

## Run it

Needs Node 22+ and a running [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (default `http://127.0.0.1:8188`). An LLM server (LM Studio or Ollama) is optional, for prompt writing and vision.

```bash
npm install
cp .env.example .env.local   # set COMFYUI_API_URL, LLM settings, auth
npm run dev                  # http://127.0.0.1:47833
```

Production: `npm run build && npm run start`. Settings → Connection checks ComfyUI and offers **Heal & ready** for a new install.

Data lives in `.prompt-studio-data/` (or `PROMPT_DATA_DIR`).

## Developing

The pages here are thin wrappers around the core package; the shared code itself is developed in the Castcut repository (`src/`, packed by `scripts/pack-core.mts`). Changes to routes come over with `scripts/export-classic.mts`.

## License

MIT — see [LICENSE](./LICENSE).
