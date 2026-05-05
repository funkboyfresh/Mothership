let dragStartIndex = null;

function handleDragStart(e, index) {
    dragStartIndex = index;
    e.target.closest('.subtask-row').classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault(); // Necessary to allow dropping
}

function handleDrop(e, targetIndex) {
    if (dragStartIndex === null || dragStartIndex === targetIndex) return;
    
    // Reorder the data array
    const item = tempSubtasks.splice(dragStartIndex, 1)[0];
    tempSubtasks.splice(targetIndex, 0, item);
    
    dragStartIndex = null;
    renderModalSubtasks();
}

function renderModalSubtasks() {
    const list = document.getElementById('modal-subtasks-list'); 
    if(!list) return; 
    list.innerHTML = '';
    
    tempSubtasks.forEach((sub, i) => {
        const row = document.createElement('div'); 
        row.className = 'subtask-row';
        row.draggable = true; // Enable native dragging
        
        // Drag Events
        row.ondragstart = (e) => handleDragStart(e, i);
        row.ondragover = (e) => handleDragOver(e);
        row.ondrop = (e) => handleDrop(e, i);
        row.ondragend = (e) => e.target.classList.remove('dragging');

        row.innerHTML = `
            <div class="drag-handle">></div>
            <input type="text" class="modal-input" value="${sub}" 
                oninput="tempSubtasks[${i}] = this.value" 
                style="background:transparent; border-color:rgba(255,255,255,0.1);">
            <button class="subtask-remove-minimal" 
                onclick="tempSubtasks.splice(${i}, 1); renderModalSubtasks();">−</button>
        `;
        list.appendChild(row);
    });
}
