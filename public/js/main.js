// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const updateStats = async () => {
    try {
      const response = await fetch('/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const stats = await response.json();

      const totalDonorsEl = document.getElementById('total-donors');
      const totalAmountEl = document.getElementById('total-amount');
      const progressBarEl = document.getElementById('donation-progress');
      const recentDonationsList = document.getElementById('recent-donations-list');

      if (totalDonorsEl) {
        totalDonorsEl.textContent = stats.totalDonors.toLocaleString();
      }
      if (totalAmountEl) {
        totalAmountEl.textContent = parseFloat(stats.totalAmount).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        });
      }

      if (progressBarEl) {
        progressBarEl.style.width = `${stats.progress}%`;
        progressBarEl.setAttribute('aria-valuenow', stats.progress);
        progressBarEl.textContent = `${stats.progress}% of $${stats.donationGoal.toLocaleString()}`;
      }

      if (recentDonationsList) {
        recentDonationsList.innerHTML = '';
        if (!stats.recentDonations || stats.recentDonations.length === 0) {
          recentDonationsList.innerHTML = '<p class="text-muted">Be the first to donate!</p>';
        } else {
          stats.recentDonations.forEach(donation => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
              <span>${donation.name}</span>
              <span class="badge bg-primary rounded-pill">${donation.type}</span>
              <span class="fw-bold text-success">$${donation.amount.toFixed(2)}</span>
            `;
            recentDonationsList.appendChild(li);
          });
        }
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  if (document.querySelector('.home-page-content')) {
    updateStats();
    setInterval(updateStats, 10000);
  }

  const donationForm = document.getElementById('donation-form');
  if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(donationForm);
      const data = Object.fromEntries(formData.entries());
      const submitBtn = donationForm.querySelector('button[type="submit"]');
      const statusMessage = document.getElementById('donation-status-message');
      if (statusMessage) statusMessage.innerHTML = '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }

      try {
        const response = await fetch('/donate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (statusMessage) {
            statusMessage.innerHTML = `
              <div class="alert alert-success mt-3" role="alert">
                <strong>Thank You, ${data.name}!</strong> ${result.message} You've donated <strong>$${Number(data.amount).toFixed(2)}</strong>. Your generosity makes a difference!
              </div>`;
          }
          donationForm.reset();
          updateStats();
        } else {
          const errorMessage = result.message || 'An unknown error occurred.';
          if (statusMessage) {
            statusMessage.innerHTML = `<div class="alert alert-danger mt-3" role="alert">Error: ${errorMessage}</div>`;
          }
        }
      } catch (error) {
        if (statusMessage) {
          statusMessage.innerHTML =
            '<div class="alert alert-danger mt-3" role="alert">Network Error: Could not reach the server.</div>';
        }
        console.error('Donation submission error:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Donate Now';
        }
      }
    });
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const statusMessage = document.getElementById('contact-status-message');
      if (statusMessage) statusMessage.innerHTML = '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const response = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (statusMessage) {
            statusMessage.innerHTML = `<div class="alert alert-success mt-3" role="alert">${result.message}</div>`;
          }
          contactForm.reset();
        } else {
          const errorMessage = result.message || 'An unknown error occurred.';
          if (statusMessage) {
            statusMessage.innerHTML = `<div class="alert alert-danger mt-3" role="alert">Error: ${errorMessage}</div>`;
          }
        }
      } catch (error) {
        if (statusMessage) {
          statusMessage.innerHTML =
            '<div class="alert alert-danger mt-3" role="alert">Network Error: Could not reach the server.</div>';
        }
        console.error('Contact submission error:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }
    });
  }
});
