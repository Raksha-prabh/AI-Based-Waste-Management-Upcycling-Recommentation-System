from flask import Flask, render_template, request, jsonify # type: ignore
import tensorflow as tf
import numpy as np
from PIL import Image
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# ------------------------
# Configuration
# ------------------------
UPLOAD_FOLDER = "static/uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ------------------------
# Load ML Model
# ------------------------
model = tf.keras.models.load_model("model/waste_model.h5")
classes = ["organic", "paper", "plastic"]


# ------------------------
# Routes (HTML Pages)
# ------------------------
@app.route("/")
def home():
    return render_template("_index.html")

@app.route("/signin")
def signin():
    return render_template("signin_project.html")

@app.route("/login")
def login():
    return render_template("project_login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboardproject.html")

@app.route("/rewards")
def rewards():
    return render_template("rewards.html")

# ------------------------
# Prediction API
# ------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    filename = secure_filename(file.filename)

    image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(image_path)

    # Image preprocessing
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))
    img = np.array(img) / 255.0
    img = np.expand_dims(img, axis=0)

    # Prediction
    preds = model.predict(img)
    label = classes[np.argmax(preds)]
    confidence = float(np.max(preds))

    return jsonify({
        "result": label,
        "confidence": round(confidence * 100, 2)
    })


@app.route('/ping')
def ping():
    return jsonify({'ok': True})

# ------------------------
# Run App
# ------------------------
if __name__ == "__main__":
    # Run without the auto-reloader to avoid watchdog restart issues
    # bind to 0.0.0.0 so localhost and 127.0.0.1 requests work
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
