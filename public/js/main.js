// Main JavaScript functionality

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeForms();
});

// Initialize form functionality
function initializeForms() {
    const internshipForm = document.getElementById('internshipForm');
    if (internshipForm) {
        internshipForm.addEventListener('submit', handleInternshipSubmit);
    }
}

// Handle internship form submission
async function handleInternshipSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        showLoading(e.target);
        
        const response = await fetch('/api/internships', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Internship posted successfully!', 'success');
            e.target.reset();
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showAlert('Error posting internship. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error posting internship. Please try again.', 'error');
    } finally {
        hideLoading(e.target);
    }
}

// Initialize filter functionality
function initializeFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplicants);
    }
    
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterApplicants);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterApplicants, 300));
    }
}

// Filter applicants functionality
function filterApplicants() {
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
    const departmentFilter = document.getElementById('departmentFilter').value.toLowerCase();
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const applicantCards = document.querySelectorAll('.applicant-card');
    
    applicantCards.forEach(card => {
        const status = card.dataset.status.toLowerCase();
        const department = card.dataset.department.toLowerCase();
        const name = card.querySelector('.applicant-info h3').textContent.toLowerCase();
        const email = card.querySelector('.applicant-info p').textContent.toLowerCase();
        
        const statusMatch = !statusFilter || status === statusFilter;
        const departmentMatch = !departmentFilter || department === departmentFilter;
        const searchMatch = !searchValue || name.includes(searchValue) || email.includes(searchValue);
        
        if (statusMatch && departmentMatch && searchMatch) {
            card.style.display = 'block';
            card.classList.add('fade-in');
        } else {
            card.style.display = 'none';
            card.classList.remove('fade-in');
        }
    });
}

// Update application status
async function updateStatus(applicationId, newStatus) {
    try {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert(`Application ${newStatus} successfully!`, 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showAlert('Error updating application status.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error updating application status.', 'error');
    }
}

// Edit internship
function editInternship(internshipId) {
    // This would typically open a modal or redirect to edit page
    // For demo purposes, we'll show an alert
    showAlert('Edit functionality would be implemented here.', 'info');
}

// Delete internship
async function deleteInternship(internshipId) {
    if (!confirm('Are you sure you want to delete this internship?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/internships/${internshipId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Internship deleted successfully!', 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showAlert('Error deleting internship.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error deleting internship.', 'error');
    }
}

// View resume (placeholder function)
function viewResume(resumeFilename) {
    showAlert(`Resume viewing functionality would open: ${resumeFilename}`, 'info');
}

// Utility functions
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alert, mainContent.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = originalText;
}

function hideLoading(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
    submitBtn.disabled = false;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Add some interactive enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card, .internship-card, .applicant-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add smooth scrolling for internal links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});