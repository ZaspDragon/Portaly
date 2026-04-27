// Build a clean email body and open the mail client (works well on mobile)
function getFormData() {
  const f = document.getElementById('checklistForm');
  const data = new FormData(f);

  const date = data.get('date') || '';
  const inspector = data.get('inspector') || '';
  const area = data.get('area') || '';
  const issues = data.get('issues') || '';
  const actions = data.get('actions') || '';
  const followup = data.get('followup') || 'No';
  const status = data.get('status') || '';
  const photos = data.get('photos') || '';

  const checks = Array.from(document.querySelectorAll('input[name="checks"]:checked'))
    .map(el => el.value);

  return { date, inspector, area, checks, issues, actions, followup, status, photos };
}

function buildSummary(d) {
  const checksText = d.checks.length ? d.checks.map(c => '• ' + c).join('\n') : '• None checked';

  return [
    'Pallet Safety Inspection Report',
    '-----------------------------------',
    `Date: ${d.date}`,
    `Inspector: ${d.inspector}`,
    `Area/Zone: ${d.area}`,
    '',
    'Checklist:',
    checksText,
    '',
    'Issues Found:',
    d.issues || 'None',
    '',
    'Actions Taken:',
    d.actions || 'None',
    '',
    `Follow-Up Required: ${d.followup}`,
    '',
    'Overall Status:',
    d.status,
    '',
    'Photo Note:',
    d.photos || 'None'
  ].join('\n');
}

function sendEmail() {
  const d = getFormData();
  if (!d.date || !d.inspector || !d.area || !d.status) {
    alert('Please fill in Date, Inspector, Area, and Overall Status.');
    return;
  }

  const subject = encodeURIComponent(`Pallet Safety Report - ${d.area} - ${d.date}`);
  const body = encodeURIComponent(buildSummary(d));

  // Replace with your email if needed
  const to = 'sidehustleLLP@gmail.com';

  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

function copySummary() {
  const d = getFormData();
  const text = buildSummary(d);

  navigator.clipboard.writeText(text)
    .then(() => alert('Summary copied to clipboard'))
    .catch(() => alert('Could not copy. Please try again.'));
}

function clearForm() {
  if (!confirm('Clear all fields?')) return;
  document.getElementById('checklistForm').reset();
}

document.getElementById('emailBtn').addEventListener('click', sendEmail);
document.getElementById('copyBtn').addEventListener('click', copySummary);
document.getElementById('clearBtn').addEventListener('click', clearForm);
