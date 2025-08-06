# Brief

A simple app analysis tool that performs operation as following

1. Collect review of customers written on google play and apple store
2. Generate prompt to ask LLM pros and cons can be derived accordingly
3. Optionally, it can utilize local model hosting by Ollama

# Installing

1. Install node.js


2. Setup the repo

```
npm instsall
```

3. Install Ollama

Making sure run ollama with ollama serve and also download the appropriate
model that is been used by your cases.

```
# run Ollama
ollama serve

# download Ollama model that make sense, like gemma3:4b
ollama pull gemma3:4b

```

4. Try a sample

```
node src/index.js --config "samples/tiktok.ini"
```

If everything is fine, you should get the summarization

# Configuration

Application behaviors are defined by a configuration file. Check samples folder
to learn more about each configuration that you can tweak

