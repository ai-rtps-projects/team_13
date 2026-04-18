import json
import random
import re
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

class ChatbotEngine:
    def __init__(self, data_path):
        with open(data_path, "r") as f:
            self.data = json.load(f)
        self.context = {}

    def detect_intent(self, text):
        text = text.lower()

        if any(w in text for w in ["vehicle","car","bike","accident","crash","collision"]):
            return "CLAIM_VEHICLE"

        if any(w in text for w in ["health","medical","hospital","surgery","doctor","treatment"]):
            return "CLAIM_HEALTH"

        if any(w in text for w in ["life","death","deceased","funeral","demise"]):
            return "CLAIM_LIFE"

        if any(w in text for w in ["status","track","progress","check my claim"]):
            return "STATUS_CHECK"

        if any(w in text for w in ["document","paperwork","files","upload","needed"]):
            return "DOCUMENTS_QUERY"

        if any(w in text for w in ["hi","hello","hey","greetings"]):
            return "GREETING"

        if any(w in text for w in ["help","what can you do","how to use"]):
            return "HELP"

        return "UNKNOWN"

    def get_response(self, text, session_id="default"):
        intent = self.detect_intent(text)

        if intent == "GREETING":
            return self.data["common_responses"]["greeting"]

        if intent == "HELP":
            return self.data["common_responses"]["help"]

        if intent == "CLAIM_VEHICLE":
            self.context[session_id] = "vehicle"
            steps = "\n".join([f"* {s}" for s in self.data["vehicle"]["steps"]])
            return (f"I'm sorry to hear about your vehicle accident. "
                    f"Here are the steps to follow:\n\n{steps}\n\n"
                    f"Would you like to know which documents are required?")

        if intent == "CLAIM_HEALTH":
            self.context[session_id] = "health"
            steps = "\n".join([f"* {s}" for s in self.data["health"]["steps"]])
            return (f"Regarding your health insurance claim, "
                    f"please follow these steps:\n\n{steps}\n\n"
                    f"Do you need the list of required documents?")

        if intent == "CLAIM_LIFE":
            self.context[session_id] = "life"
            steps = "\n".join([f"* {s}" for s in self.data["life"]["steps"]])
            return (f"My deepest condolences. Here's what you need to do:\n\n{steps}\n\n"
                    f"I can also provide a document checklist if you're ready.")

        if intent == "DOCUMENTS_QUERY":
            claim_type = self.context.get(session_id)
            if claim_type:
                docs = "\n".join([f"* {d}" for d in self.data[claim_type]["documents"]])
                return (f"For your {self.data[claim_type]['name']} claim, "
                        f"you will need the following documents:\n\n{docs}")
            else:
                return "Which insurance type? (Vehicle, Health, or Life)"

        if intent == "STATUS_CHECK":
            return random.choice(self.data["status_descriptions"])

        return self.data["common_responses"]["not_found"]


chatbot = ChatbotEngine("data/claims.json")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")

    if not user_message.strip():
        return jsonify({"response": "I didn't hear anything! How can I help you?"})

    bot_response = chatbot.get_response(user_message)
    return jsonify({"response": bot_response})


if __name__ == "__main__":
    app.run(debug=True)
