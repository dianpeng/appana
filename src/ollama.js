const Ollama = require("ollama").Ollama; // workaround

class Model {
  constructor(model, system, host, headers) {
    this.model = model;
    this.system = system;
    this.impl = new Ollama({
      host: host,
      headers: headers,
    });
  }

  _wrap(msg) {
    if (this.system) {
      return {
        model: this.model,
        system: this.system,
        prompt: msg,
        stream: true,
      };
    } else {
      return {
        model: this.model,
        prompt: msg,
        stream: true,
      };
    }
  }

  async complete(message) {
    const response = await this.impl.generate(this._wrap(message));
    const out = [];
    for await (const p of response) {
      out.push(p.response);
    }
    return out.join("");
  }

  driverName() {
    return "ollama";
  }
  modelName() {
    return this.model;
  }
}

module.exports = Model;
