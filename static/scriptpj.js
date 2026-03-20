// Show/Hide sections
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

// Add points
function recalcPoints() {
  const plastic = parseInt(localStorage.getItem('plastic_completions') || '0');
  const cloth = parseInt(localStorage.getItem('cloth_completions') || '0');
  const total = (plastic * 10) + (cloth * 5);
  localStorage.setItem('ecoPoints', total);
  const pointsEl = document.getElementById('points');
  if (pointsEl) pointsEl.innerText = total;
  return total;
}

function addPoints(points) {
  // Keep a simple notification, totals are derived from completion counts
  alert('You earned ' + points + ' points!');
  recalcPoints();
}

// Load points and completion counts from localStorage on page load
window.addEventListener('DOMContentLoaded', function() {
  const plasticCount = document.getElementById('plasticCount');
  const clothCount = document.getElementById('clothCount');
  if (plasticCount) plasticCount.innerText = localStorage.getItem('plastic_completions') || '0';
  if (clothCount) clothCount.innerText = localStorage.getItem('cloth_completions') || '0';
  // Recalculate total points from completions to avoid drift
  recalcPoints();
});

// Recommendations map (arrays of ideas)
const recommendations = {
  organic: ['Composting', 'Organic manure', 'Biogas'],
  paper: ['Paper bags', 'Notebook reuse', 'Gift wrapping'],
  plastic: ['Make plant pots', 'Reuse as storage', 'Bottle crafts']
};

function showRecommendationFor(label) {
  const key = String(label || '').toLowerCase();
  const container = document.getElementById('recommendations');
  if (!container) return;
  const list = recommendations[key] || ['Follow local disposal guidelines.'];

  // pick one random suggestion to show immediately
  const pick = list[Math.floor(Math.random() * list.length)];

  // Build HTML: show picked suggestion and a small "more" toggle to view all
  container.innerHTML = `
    <div style="background:#f7f9fb;border-left:4px solid #4caf50;padding:12px;border-radius:6px;">
      <strong style="font-size:16px;">Recommendation</strong>
      <p style="margin:6px 0 0;"><em>${pick}</em></p>
      <a href="#" id="showMoreIdeas" style="display:inline-block;margin-top:8px;color:#007bff;">More ideas</a>
      <button id="dismissRec" style="margin-top:8px;margin-left:8px;padding:6px 10px;border:none;background:#4caf50;color:white;border-radius:4px;cursor:pointer;">Dismiss</button>
      <div id="allIdeas" style="display:none;margin-top:10px;"></div>
    </div>
  `;
  container.style.display = 'block';

  const btn = document.getElementById('dismissRec');
  if (btn) btn.addEventListener('click', () => { container.style.display = 'none'; container.innerHTML=''; });

  const more = document.getElementById('showMoreIdeas');
  if (more) {
    more.addEventListener('click', (ev) => {
      ev.preventDefault();
      const all = document.getElementById('allIdeas');
      if (!all) return;
      if (all.style.display === 'none') {
        all.style.display = 'block';
        all.innerHTML = '<ul style="margin:6px 0 0;padding-left:18px;">' + list.map(i => `<li>${i}</li>`).join('') + '</ul>';
        more.textContent = 'Hide ideas';
      } else {
        all.style.display = 'none';
        all.innerHTML = '';
        more.textContent = 'More ideas';
      }
    });
  }
}

// Image preview on file select
document.getElementById("imageInput")?.addEventListener("change", function (e) {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const imagePreview = document.getElementById("imagePreview");
      document.getElementById("uploadedImage").src = event.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

// Challenge image previews
document.querySelectorAll('.challenge-form').forEach((form, index) => {
  const input = form.querySelector('.challengeInput');
  const preview = form.nextElementSibling;
  const challengeId = index === 0 ? 'plastic' : 'cloth';
  
  // Guard to avoid attaching duplicate handlers if script runs twice
  if (form.dataset.handlerAttached) return;
  form.dataset.handlerAttached = '1';

  input.addEventListener('change', function (e) {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        preview.querySelector('img').src = event.target.result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
  
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const points = index === 0 ? 10 : 5;

    // Require a selected file to avoid accidental/programmatic submits
    const selectedFile = form.querySelector('.challengeInput')?.files?.[0];
    if (!selectedFile) {
      alert('Please select an image to submit the challenge.');
      return;
    }
    
    // Track challenge completions
    const completions = parseInt(localStorage.getItem(challengeId + '_completions') || '0') + 1;
    localStorage.setItem(challengeId + '_completions', completions);
    console.log('localStorage set:', challengeId + '_completions', completions);
    
    // Update counter display
    const countEl = document.getElementById(challengeId + 'Count');
    if (countEl) countEl.innerText = completions;

    // Recalculate and update any visible points elements (dashboard & rewards)
    const total = recalcPoints();
    const totalPointsEl = document.getElementById('totalPoints');
    if (totalPointsEl) totalPointsEl.innerText = total;
    const plasticCountEl = document.getElementById('plasticCount');
    const clothCountEl = document.getElementById('clothCount');
    if (plasticCountEl) plasticCountEl.innerText = localStorage.getItem('plastic_completions') || '0';
    if (clothCountEl) clothCountEl.innerText = localStorage.getItem('cloth_completions') || '0';
    
    addPoints(points);
    form.reset();
    preview.style.display = "none";
  });
});

// Upload form handler
document.getElementById("uploadForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("imageInput");
  const formData = new FormData();

  formData.append("image", fileInput.files[0]);
  try {
    const response = await fetch('/predict', { method: 'POST', body: formData });
    const data = await response.json();
    if (data.error) {
      document.getElementById('result').innerText = 'Error: ' + data.error;
    } else {
      document.getElementById('result').innerText = 'Detected Waste Type: ' + data.result.toUpperCase() + ' (' + data.confidence + '%)';
      // Show a single recommendation for this detection
      showRecommendationFor(data.result);
      this.reset();
      document.getElementById('imagePreview').style.display = 'none';
    }
  } catch (error) {
    console.error('Upload error:', error);
    document.getElementById('result').innerText = 'Error: Could not connect to server';
  }
});
