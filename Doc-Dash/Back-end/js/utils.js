// Global namespace for Doc-Dash modules
window.DocDash = window.DocDash || {};

// Notification system (exposed globally)
window.DocDash.showNotification = function(type, title, message) {
	const existingNotifications = document.querySelectorAll('.notification');
	existingNotifications.forEach(function(notification){ notification.remove(); });

	const notification = document.createElement('div');
	notification.className = 'notification ' + type;

	var icon = '';
	switch (type) {
		case 'success': icon = '✓'; break;
		case 'error': icon = '✕'; break;
		case 'warning': icon = '⚠'; break;
		case 'info': icon = 'ℹ'; break;
	}

	notification.innerHTML = '\n\t\t<div class="notification-icon">' + icon + '</div>\n\t\t<div class="notification-content">\n\t\t\t<div class="notification-title">' + title + '</div>\n\t\t\t<div class="notification-message">' + message + '</div>\n\t\t</div>\n\t\t<button class="notification-close" onclick="this.parentElement.remove()">×</button>\n\t';

	document.body.appendChild(notification);

	setTimeout(function(){ notification.classList.add('show'); }, 100);
	setTimeout(function(){
		if (notification.parentElement) {
			notification.classList.remove('show');
			setTimeout(function(){ if (notification.parentElement) { notification.remove(); } }, 300);
		}
	}, 5000);
};

// Backwards-compatible globals
window.showNotification = window.DocDash.showNotification;

// Activity log buffer (kept in-memory like before)
window.DocDash.activityLogData = window.DocDash.activityLogData || [];

// Log activity (exposed globally)
window.DocDash.logActivity = function(user, action, details, oldValue, newValue) {
	var now = new Date();
	var timestamp = now.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
	var nextId = window.DocDash.activityLogData.length > 0 ? Math.max.apply(null, window.DocDash.activityLogData.map(function(l){ return l.id; })) + 1 : 1;
	window.DocDash.activityLogData.push({ id: nextId, timestamp: timestamp, user: user, action: action, details: details, oldValue: oldValue || null, newValue: newValue || null });
};

// Backwards-compatible globals
window.logActivity = window.DocDash.logActivity;


