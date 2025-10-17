(function(){
	window.DocDash = window.DocDash || {};

	var inventoryItems = [
		{ id: 1, name: 'Bandages (Sterile)', quantity: 150, unit: 'Packs', lastUpdated: '2023-10-15', supplier: 'MedSupply Co.', expiryDate: '2024-12-31', location: 'Supply Room A' },
		{ id: 2, name: 'Pain Relievers (Paracetamol)', quantity: 2000, unit: 'Tablets', lastUpdated: '2023-10-14', supplier: 'PharmaDistributors', expiryDate: '2025-06-30', location: 'Pharmacy Cabinet' },
		{ id: 3, name: 'Syringes (5ml)', quantity: 500, unit: 'Units', lastUpdated: '2023-10-13', supplier: 'HealthEquip', expiryDate: '2024-09-15', location: 'Treatment Room' }
	];
	var currentInventoryItems = inventoryItems.slice();
	window.DocDash.inventoryItems = currentInventoryItems;

	var tableBody = document.querySelector('#inventoryTable tbody');
	var searchInput = document.getElementById('inventorySearchInput');
	var searchIcon = document.getElementById('inventorySearchIcon');

	function renderInventoryTable(filter){
		filter = filter || '';
		if (!tableBody) return;
		tableBody.innerHTML = '';
		var filtered = currentInventoryItems.filter(function(item){
			return item.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
				item.unit.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
				item.supplier.toLowerCase().indexOf(filter.toLowerCase()) !== -1 ||
				item.location.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
		});

		try {
			var totalEl = document.getElementById('docInvTotalItems');
			var lowEl = document.getElementById('docInvLowStock');
			var expEl = document.getElementById('docInvExpiring');
			if (totalEl) totalEl.textContent = currentInventoryItems.length;
			if (lowEl) lowEl.textContent = currentInventoryItems.filter(function(i){ return typeof i.quantity === 'number' && i.quantity <= 10; }).length;
			if (expEl) {
				var today = new Date();
				var in30 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
				expEl.textContent = currentInventoryItems.filter(function(i){ if (!i.expiryDate) return false; var d = new Date(i.expiryDate); if (isNaN(d)) return false; return d >= today && d <= in30; }).length;
			}
		} catch (e) {}

		filtered.forEach(function(item){
			var row = tableBody.insertRow();
			row.innerHTML = '<td>' + item.name + '</td><td>' + item.quantity + '</td><td>' + item.unit + '</td><td>' + item.lastUpdated + '</td>';
		});
	}
	window.DocDash.renderInventoryTable = renderInventoryTable;

	async function tryLoadInventoryFromApi(){
		try {
			var res = await fetch('/4care/Doc-Dash/Back-end/api/get-inventory.php', { cache: 'no-store' });
			var data = await res.json();
			if (data && data.success && Array.isArray(data.data)) {
				currentInventoryItems = data.data.map(function(row){ return { id: row.id, name: row.name || '', quantity: parseInt(row.quantity || 0), unit: row.unit || '', lastUpdated: row.last_updated || row.created_at || '', expiryDate: row.expiry_date || row.expiryDate || '' }; });
				renderInventoryTable(searchInput ? searchInput.value : '');
			}
		} catch (e) {}
	}
	window.DocDash.tryLoadInventoryFromApi = tryLoadInventoryFromApi;

	if (searchIcon) searchIcon.addEventListener('click', function(){ renderInventoryTable(searchInput ? searchInput.value : ''); });
	if (searchInput) searchInput.addEventListener('keyup', function(){ renderInventoryTable(searchInput.value); });

	renderInventoryTable('');
	tryLoadInventoryFromApi();
	setInterval(tryLoadInventoryFromApi, 10000);
	window.addEventListener('focus', tryLoadInventoryFromApi);
	document.addEventListener('visibilitychange', function(){ if (!document.hidden) tryLoadInventoryFromApi(); });
	window.addEventListener('online', tryLoadInventoryFromApi);

	// Add/Edit inventory modals
	var addOverlay = document.getElementById('addInventoryItemModalOverlay');
	var addCloseBtn = document.getElementById('closeAddInventoryItemModalBtn');
	var addCancel = document.getElementById('cancelAddInventoryItemForm');
	var addForm = document.getElementById('addInventoryItemForm');
	function closeAdd(){ if (addOverlay){ addOverlay.classList.remove('active'); document.body.style.overflow=''; if (addForm) addForm.reset(); } }
	if (addCloseBtn) addCloseBtn.addEventListener('click', closeAdd);
	if (addCancel) addCancel.addEventListener('click', closeAdd);
	if (addOverlay) addOverlay.addEventListener('click', function(e){ if (e.target === addOverlay) closeAdd(); });
	if (addForm) addForm.addEventListener('submit', function(e){ e.preventDefault(); var newItem = { id: inventoryItems.length > 0 ? Math.max.apply(null, inventoryItems.map(function(i){return i.id;})) + 1 : 1, name: (document.getElementById('itemName')||{}).value, quantity: parseInt((document.getElementById('itemQuantity')||{}).value), unit: (document.getElementById('itemUnit')||{}).value, lastUpdated: new Date().toISOString().slice(0,10), supplier: (document.getElementById('itemSupplier')||{}).value, expiryDate: (document.getElementById('itemExpiryDate')||{}).value, location: (document.getElementById('itemLocation')||{}).value }; inventoryItems.push(newItem); renderInventoryTable(''); window.DocDash.logActivity('Nurse','Added New Inventory Item','Item: ' + newItem.name + ', Quantity: ' + newItem.quantity + ' ' + newItem.unit, null, newItem); alert('New Inventory Item Added!'); closeAdd(); });

	var editOverlay = document.getElementById('editInventoryItemModalOverlay');
	var editCloseBtn = document.getElementById('closeEditInventoryItemModalBtn');
	var editCancel = document.getElementById('cancelEditInventoryItemForm');
	var editForm = document.getElementById('editInventoryItemForm');
	function openEdit(item){ var set = function(id, v){ var el = document.getElementById(id); if (el) el.value = v; }; set('editItemId', item.id); set('editItemName', item.name); set('editItemQuantity', item.quantity); set('editItemUnit', item.unit); set('editItemSupplier', item.supplier); set('editItemExpiryDate', item.expiryDate); set('editItemLocation', item.location); if (editOverlay){ editOverlay.classList.add('active'); document.body.style.overflow='hidden'; } }
	function closeEdit(){ if (editOverlay){ editOverlay.classList.remove('active'); document.body.style.overflow=''; if (editForm) editForm.reset(); } }
	window.DocDash.openEditInventoryItemModal = openEdit;
	if (editCloseBtn) editCloseBtn.addEventListener('click', closeEdit);
	if (editCancel) editCancel.addEventListener('click', closeEdit);
	if (editOverlay) editOverlay.addEventListener('click', function(e){ if (e.target === editOverlay) closeEdit(); });
	if (editForm) editForm.addEventListener('submit', function(e){ e.preventDefault(); var updated = { id: parseInt((document.getElementById('editItemId')||{}).value), name: (document.getElementById('editItemName')||{}).value, quantity: parseInt((document.getElementById('editItemQuantity')||{}).value), unit: (document.getElementById('editItemUnit')||{}).value, lastUpdated: new Date().toISOString().slice(0,10), supplier: (document.getElementById('editItemSupplier')||{}).value, expiryDate: (document.getElementById('editItemExpiryDate')||{}).value, location: (document.getElementById('editItemLocation')||{}).value }; var idx = inventoryItems.findIndex(function(i){ return i.id === updated.id; }); if (idx > -1) { var oldItem = Object.assign({}, inventoryItems[idx]); inventoryItems[idx] = updated; renderInventoryTable(''); window.DocDash.logActivity('Nurse','Updated Inventory Item','Item: ' + updated.name + ', Quantity changed from ' + oldItem.quantity + ' to ' + updated.quantity, oldItem, updated); alert('Inventory Item Updated Successfully!'); } else { alert('Error: Item not found.'); } closeEdit(); });

	// Print inventory
	var printBtn = document.getElementById('printInventoryBtn');
	if (printBtn) printBtn.addEventListener('click', function(){ var table = document.getElementById('inventoryTable'); var win = window.open('', '_blank'); var styles = '<style>body{font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;margin:20px;}h1{color:#1a73e8;text-align:center;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;color:#333;font-weight:bold;}tr:nth-child(even){background-color:#f9f9f9;}.data-table th:last-child,.data-table td:last-child{display:none;}</style>'; win.document.write('<html><head><title>Inventory Report</title>' + styles + '</head><body><h1>Inventory Report</h1>' + (table ? table.outerHTML : '') + '</body></html>'); win.document.close(); win.print(); });

})();


