    const socket = io();

    socket.on("connect", () => {
      //console.log("Socket connected:", socket.id);
      socket.emit("joinRoom", {managerId: managerId});
    });
    
    socket.on("addExpense", (data) => {
      let table = document.querySelector("#reviewTable tbody");
      if(!table) return
      let tr = document.createElement("tr");
      if(!tr) return

      tr.innerHTML = `
      <td><b>${data.title}</b></td>
      <td>${data.userName}</td>
      <td>${data.category}</td>
      <td>₹${data.amount}</td>
      <td>${moment(data.date).format("ll")}</td>`;

      // Create last cell for button
      const tdAction = document.createElement("td");
      const div = document.createElement("div");
      div.className = "action-buttons";

      const btn = document.createElement("button");
      btn.className = "btn btn-outline";
      btn.style.padding = "0.375rem 0.75rem";
      btn.textContent = "Review";

      // Add data attributes
      btn.dataset.id = data._id || "";

      // Add onclick
      btn.onclick = () => reviewExpense(btn);

      div.appendChild(btn);
      tdAction.appendChild(div);
      tr.appendChild(tdAction);

      // Append row to table
      table.appendChild(tr);
      pendingReq += 1;
      document.getElementById("pendingAlert").textContent = pendingReq;
      document.getElementById("managerPendingExpense").textContent = pendingReq;
      document.getElementById("tablePendingCount").textContent = pendingReq + " Pending";
      document.getElementById("alert").style.display = "flex";
      document.getElementById("defaultPendingCount").style.display = "none";
    });

    async function reviewExpense(button) {
      const id = button.dataset.id;
      const response = await fetch(`/helper/expenses/${id}`);
      if(response.ok === false) {
        alert("Failed to fetch user details.");
        return;
      }
      const data = await response.json();
      // console.log(data);
      document.getElementById('expense-title').textContent = data.title;
      document.getElementById('expense-employee').textContent = data.userId.name;
      document.getElementById('expense-amount').textContent = "₹" + data.amount;
      document.getElementById('expense-category').textContent = data.category;
      document.getElementById('expense-date').textContent = moment(data.date).format("ll");
      document.getElementById('expense-description').textContent = data.description;
      document.getElementById('rejectId').value = data._id;
      document.getElementById('approvedId').value = data._id;
      document.getElementById('billImage').src = data.image.url;
      openModal('reviewExpenseModal');
    }

    function approveExpense(button) {
      closeModal('reviewExpenseModal');
    }

    function rejectExpense(button) {
      closeModal('reviewExpenseModal');
    }

    function openModal(modalId) {
      document.body.style.overflow = "hidden";
      document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
      document.body.style.overflow = "auto";
    }

    // Close modal on outside click
    window.onclick = function (event) {
      if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
      }
    }