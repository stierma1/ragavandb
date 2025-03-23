const request = require('request');
const fs = require('fs');
const { spawn } = require('child_process');
const { Readable } = require('stream');
const imageToBase64 = require('image-to-base64');

class OllamaGenerate {
    constructor(apiUrl, options = {}) {
      this.apiUrl = apiUrl;
      this.options = {
        model: 'deepseek-r1:32b',
        maxTokens: 2000,
        ...options
      };
      this.promptPrefix = options.promptPrefix || "";
      this.promptSuffix = options.promptSuffix || "";
    }
    
    // Generate text response from text prompt
    async generateText(prompt, options = {}) {
      let imageBase64Images = undefined;
      if(options.imageUrl){
        imageBase64Images = [await imageToBase64(options.imageUrl)];
      }  

      const requestOptions = {
        url: `${this.apiUrl}/generate`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        json: true,
        body: {
          prompt: this.promptPrefix + prompt + this.promptSuffix,
          model: this.options.model,
          images: imageBase64Images,
          temperature: options.temperature || this.options.temperature,
          max_tokens: options.maxTokens || this.options.maxTokens
        }
      };
  
      return new Promise((resolve, reject) => {
        request(requestOptions, (error, response, body) => {
          if (error) {
            reject(error);
            return;
          }
  
          if (response.statusCode !== 200) {
            reject(new Error(`API error: ${body.error}`));
            return;
          }
  
          resolve(body);
        });
      });
    }
  
    async collectGenerateHttpText(prompt, options) {
      const responseBlob = await this.generateText(prompt, options);
      const responses = JSON.parse("[" + responseBlob.replace(/\"done\"\:false\}/g, "\"done\":false},") + "]")
      let resp =  responses.map(({ response }) => {
        return response;
      }).join("");
      if(resp.split("</think>").length > 1){
        return resp.split("</think>")[1].trim();
      } else {
        return resp.trim();
      }
    }
  
    async generateTextResponseThink(prompt, options) {
      const responseText = await this.spawnProcess(prompt, this.options.model);
      const responseSplit = responseText.split("</think>");
      const thoughts = responseSplit[0].replace("<think>", "").trim();
      responseSplit.shift();
      const response = responseSplit.join("").trim();
      return { thoughts, response };
    }
  
  
    // Generate image from prompt
    async generateImage(prompt, imagePathOrUrl, options = {}) {
      let imageBase64;
  
      // If it's a file path, read and convert to base64
      if (typeof imagePathOrUrl === 'string' && !imagePathOrUrl.startsWith('http')) {
        const imageBuffer = fs.readFileSync(imagePathOrUrl);
        imageBase64 = imageBuffer.toString('base64');
      } else {
        // If it's a URL, we need to download and convert
        throw new Error('URL-based images not implemented yet. Please provide file path.');
      }
  
      const requestOptions = {
        url: `${this.apiUrl}/generate`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        json: true,
        body: {
          prompt: prompt,
          image: imageBase64,
          negative_prompt: options.negativePrompt || '',
          model: this.options.model,
          width: options.width || 512,
          height: options.height || 512
        }
      };
  
      return new Promise((resolve, reject) => {
        request(requestOptions, (error, response, body) => {
          if (error) {
            reject(error);
            return;
          }
  
          if (response.statusCode !== 200) {
            reject(new Error(`API error: ${body.error}`));
            return;
          }
  
          resolve(body);
        });
      });
    }
  
    async spawnProcess(prompt, model) {
      const childProcess = spawn('ollama', ["run", model], {shell:true});
      
      return await new Promise((resolve, reject) => {
         // Create a readable stream from the string
      const stringStream = Readable.from(prompt);
  
      // Pipe the string stream to stdin
        stringStream.pipe(childProcess.stdin);
        let responseAccumulator = '';
        let errAccum = '';
        let hasError = false;
        childProcess.stdout.on('data', (chunk) => {
          // Accumulate the response
          responseAccumulator += chunk.toString();
        });
  
        childProcess.on('error', (err) => {
          errAccum += err.toString();
          hasError = true;
        });
  
        childProcess.on('close', () => {
          // Check if there was any error
          if (!hasError) {
            resolve(responseAccumulator)
          } else {
            reject(errAccum)
          }
  
        });
      })
    }
  }
  
const shortSynopsisTextClient = new OllamaGenerate('http://localhost:11434/api', {
    model: process.env["RAGAVAN_SYNOPSIS_MODEL"] || 'deepseek-r1:32b',
    temperature: 0.7,
    maxTokens:2000,
    promptPrefix: "I need you to extract the key pieces from the followng text.  You goal is to create a short synopsis.  Identify possible unique features that would make it uniquely identifiable.  Here is the text: "
  });

  const tagTextClient = new OllamaGenerate('http://localhost:11434/api', {
    model: process.env["RAGAVAN_TAGS_MODEL"] || 'deepseek-r1:14b',
    temperature: 0.7,
    maxTokens:2000,
    promptPrefix: "",
    promptSuffix: "Your goal is to create a list of classifying tags for the text above.  Tags should be 3 words or less per tag.  Be terse and refined.  The list should be less than 30 tags total.  Your response should be a list of classifying tags."
  });

  const imageSynopsis = new OllamaGenerate('http://localhost:11434/api', {
    model: process.env["RAGAVAN_IMAGE_SYNOPSIS_MODEL"] || 'llava:latest',
    temperature: 0.7,
    maxTokens:2000,
    promptPrefix: "",
    promptSuffix: "Your goal is write a description of the associated image.  Describe the entities or people inside the image if there are any.  Describe the style of art if its an artistic image."
  });

  module.exports = {
    shortSynopsisTextClient,
    tagTextClient,
    imageSynopsis
  }

  
