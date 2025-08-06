const Ollama = require("ollama").Ollama; // workaround
const FS = require("fs");
const Path = require("path");

class Option {
  constructor(
    model, // model name
    system, // system prompt
    host, // host server address
    headers, // aux headers
    temp, // temperature of model
  ) {
    this.model = model;
    this.system = system;
    this.host = host;
    this.headers = headers;
    this.temperature = temp;
  }
}

class Model {
  constructor(option) {
    this.option = option;
    this.impl = new Ollama({
      host: option.host,
      headers: option.headers,
    });
  }

  _wrapOption() {
    if (this.option.temperature !== undefined) {
      return {
        temperature: this.option.temperature,
      };
    } else {
      return undefined;
    }
  }

  _wrap(msg) {
    if (this.option.system) {
      return {
        model: this.option.model,
        system: this.option.system,
        prompt: msg,
        stream: true,
        options: this._wrapOption(),
      };
    } else {
      return {
        model: this.option.model,
        prompt: msg,
        stream: true,
        options: this._wrapOption(),
      };
    }
  }

  // the following code is not very flexible since different models demand
  // different types of model input
  //
  // [1] gemma uses raw base64
  // [2] some model uses URL format

  _getMime(filePath) {
    const ext = Path.extname(filePath).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    throw new Error("Unsupported file type");
  }

  _wrapOneImg(imgPath) {
    const absPath = Path.resolve(imgPath);
    const imgData = FS.readFileSync(absPath);
    const mime = this._getMime(absPath);
    // const out = `data:${mime};base64,${imgData.toString('base64')}`;
    return imgData.toString("base64");
  }

  _wrapImg(imgPath) {
    const out = [];
    for (const p of imgPath) {
      out.push(this._wrapOneImg(p));
    }
    return out;
  }

  _wrapWithImage(msg, imgPath) {
    if (this.system) {
      return {
        model: this.option.model,
        system: this.option.system,
        prompt: msg,
        stream: true,
        images: this._wrapImg(imgPath),
        options: this._wrapOption(),
      };
    } else {
      return {
        model: this.option.model,
        prompt: msg,
        stream: true,
        images: this._wrapImg(imgPath),
        options: this._wrapOption(),
      };
    }
  }

  async _readAll(response) {
    const out = [];
    for await (const p of response) {
      out.push(p.response);
    }
    return out.join("");
  }

  // --------------------------------------------------------------------------
  // Public interfaces

  async complete(message) {
    const response = await this.impl.generate(this._wrap(message));
    return await this._readAll(response);
  }

  async completeWithImage(message, allImagePath) {
    const response = await this.impl.generate(
      this._wrapWithImage(message, allImagePath),
    );
    return await this._readAll(response);
  }

  driverName() {
    return "ollama";
  }
  modelName() {
    return this.model;
  }
}

module.exports = {
  Model: Model,
  Option: Option,
};
