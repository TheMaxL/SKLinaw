const Signup = {
  currentStep: 1,

  next() {
    if (!this._validate(this.currentStep)) return;
    this._goStep(this.currentStep + 1);
  },

  back() {
    this._goStep(this.currentStep - 1);
  },

  _validate(step) {
    hideAlert('signup-alert');
    if (step === 1) {
      const first = document.getElementById('reg-first-name').value.trim();
      const last  = document.getElementById('reg-last-name').value.trim();
      if (!first || !last) {
        setAlert('signup-alert', 'Please fill in your first and last name.');
        return false;
      }
    }
    if (step === 2) {
      const pw  = document.getElementById('reg-password').value;
      const pw2 = document.getElementById('reg-confirm').value;
      if (!pw || pw.length < 6) {
        setAlert('signup-alert', 'Password must be at least 6 characters.');
        return false;
      }
      if (pw !== pw2) {
        setAlert('signup-alert', 'Passwords do not match.');
        return false;
      }
    }
    return true;
  },

  _goStep(n, reset = false) {
    document.getElementById(`panel-${this.currentStep}`)?.classList.remove('active');
    const oldInd = document.getElementById(`step-ind-${this.currentStep}`);
    if (!reset) {
      oldInd.classList.remove('active');
      if (n > this.currentStep) oldInd.classList.add('done');
      else oldInd.classList.remove('done');
    }
    this.currentStep = n;
    document.getElementById(`panel-${n}`)?.classList.add('active');
    const newInd = document.getElementById(`step-ind-${n}`);
    newInd.classList.remove('done');
    newInd.classList.add('active');
  },

  onFileSelect(input) {
    const fn = document.getElementById('reg-file-name');
    if (input.files.length > 0) {
      fn.textContent    = '📎 ' + input.files[0].name;
      fn.style.display  = 'block';
    }
  },

  async submit() {
    const file = document.getElementById('reg-proof').files[0];
    if (!file) {
      setAlert('signup-alert', 'Please upload proof of your SK position.');
      return;
    }

    const btn = document.getElementById('submit-btn');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting…';

    const firstName = document.getElementById('reg-first-name').value.trim();
    const lastName  = document.getElementById('reg-last-name').value.trim();
    const formData  = new FormData();
    formData.append('name',     `${firstName} ${lastName}`);
    formData.append('password', document.getElementById('reg-password').value);
    formData.append('photo',    file);

    try {
      const res  = await fetch(`${API}/submitCredentials`, { method: 'POST', body: formData });
      const text = await res.text();
      if (text === 'SUCCESS') {
        this._showSuccess();
      } else {
        setAlert('signup-alert', 'Submission failed: ' + text);
        btn.disabled  = false;
        btn.innerHTML = 'Submit →';
      }
    } catch {
      // Dev preview
      this._showSuccess();
    }
  },

  _showSuccess() {
    document.getElementById('steps-bar').style.display    = 'none';
    document.getElementById('form-area').style.display    = 'none';
    document.getElementById('signup-footer').style.display = 'none';
    document.getElementById('signup-success').classList.add('show');
    hideAlert('signup-alert');
  }
};

// Drag-and-drop for upload
document.addEventListener('DOMContentLoaded', () => {
  const ua = document.getElementById('upload-area');
  if (!ua) return;
  ua.addEventListener('dragover',  e => { e.preventDefault(); ua.classList.add('dragover'); });
  ua.addEventListener('dragleave', () => ua.classList.remove('dragover'));
  ua.addEventListener('drop', e => {
    e.preventDefault();
    ua.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      Signup.onFileSelect({ files: e.dataTransfer.files });
    }
  });
});
