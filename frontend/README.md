# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


ai.controller.js


const aiService = require("../services/ai.service");

module.exports.getResponse = async (req, res) => {
  try {
    const code = req.body.code;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const prompt = `
You are a senior JavaScript code reviewer.
Review the following code and:
1. Point out issues or improvements.
2. Suggest better practices.
3. Format your answer in Markdown.
4. Include syntax-highlighted code examples inside triple backticks.

Code to review:
\`\`\`javascript
${code}
\`\`\`
`;

    const reviewText = await aiService.getAIResponse(prompt);
    res.status(200).json({ response: reviewText });

  } catch (error) {
    console.error("AI Controller Error:", error.message);

    if (error.message.includes("overloaded")) {
      return res.status(503).json({ error: "The AI service is overloaded. Please try again in a moment." });
    }

    if (error.message.includes("unavailable")) {
      return res.status(503).json({ error: "The AI service is currently unavailable. Please try again later." });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};




ai.routes.js



const express = require("express");
const router = express.Router();
const { getResponse } = require("../controllers/ai.controller");

router.post("/get-response", getResponse); // ✅ Change GET → POST

module.exports = router;



ai.service.js


require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to call Gemini with retries and fallback
async function getAIResponse(prompt) {
  let models = ["gemini-2.0-flash", "gemini-2.5-pro"];

  for (let modelName of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔹 Using model: ${modelName}, attempt ${attempt}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        if (error.message.includes("overloaded") && attempt < 3) {
          console.warn(` Model overloaded. Retrying in 2s...`);
          await new Promise(res => setTimeout(res, 2000));
        } else if (attempt === 3) {
          console.error(` Failed with model: ${modelName}`, error.message);
          break; 
        }
      }
    }
  }

  throw new Error("AI service unavailable after retries and fallback");
}

module.exports = { getAIResponse };


































