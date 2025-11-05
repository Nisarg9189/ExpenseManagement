const socket = io();

    socket.on("connect", () => {
    //console.log("Socket connected:", socket.id);
    // socket.emit("joinRoom", {adminId: "<%= adminId %>"});
    socket.emit("joinRoom", {adminId: adminId});
    });

    socket.on("addExpense", (data) => {
    let table = document.querySelector("#expenseTable tbody");
    if(!table) return;
    let tr = document.createElement("tr");
    if(!tr) return;
    tr.dataset.id = data._id;

    tr.innerHTML = `
    <td><b>${data.title}</b></td>
    <td>${data.userName}</td>
    <td>${data.category}</td>
    <td id="amt">₹${data.amount}</td>
    <td><span class="badge badge-pending">PENDING</span></td>
  <td>${moment(data.date).format("ll")}</td>`;

    table.appendChild(tr);

    pending += 1;
    totalExp += data.amount;
    document.getElementById("pendingCnt").textContent = pending;
    document.getElementById("totalExpense").textContent = "₹" + totalExp;
    });

    socket.on("approvedExpense", (data) => {
    // Find the row with matching data-id
    let tr = document.querySelector(`tr[data-id="${data._id}"]`);
    //console.log(tr);
    if (!tr) return; // safetychec
    // Find the badge inside that row
    let status = tr.querySelector(".badge");

    // Update the badge
    status.className = "badge badge-approved";
    status.textContent = "APPROVED";

    // Decrease pending count and update display
    pending -= 1;
    if(pending < 0) pending=0;
    document.getElementById("pendingCnt").textContent = pending;
    });

    socket.on("rejectedExpense", (data) => {
    // Find the row with matching data-id
    let tr = document.querySelector(`tr[data-id="${data._id}"]`);
    // console.log(tr);
    if (!tr) return; // safety check

    // Find the badge inside that row
    let status = tr.querySelector(".badge");
    let amt = tr.querySelector("#amt").textContent.trim().replace(/[^\d.]/g, "");
    let amount = parseInt(amt);
    console.log(amount);
    // Update the badge
    status.className = "badge badge-rejected";
    status.textContent = "REJECTED";

    //Decrease pending count and update display
    pending -= 1;
    if(pending < 0) pending=0;
    document.getElementById("pendingCnt").textContent = pending;

    reject += 1;
    document.getElementById("rejectedCount").textContent = reject;

    rejectedSum += amount;
    document.getElementById("rejectedSum").textContent = "Total: " + "₹" + rejectedSum;
    });


    
    function openModal(modalId) {
      document.body.style.overflow = "hidden";
      document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
      document.body.style.overflow = "auto";
      document.getElementById(modalId).classList.remove('active');
    }

    async function edit(button) {
      const userId = button.dataset.id;
      console.log("Editing user:", userId);
      const response = await fetch(`/helper/details/${userId}`);
      // console.log(response);
      if(response.ok === false) {
        alert("Failed to fetch user details.");
        return;
      }
      const data = await response.json();
      console.log(data);

      // open your modal and fill in data
      openModal('editUserModal');
      document.getElementById('editName').value = data.name;
      document.getElementById('editRole').value = data.role;
      document.getElementById('editManager').value = data.managerId?._id || "";

      document.getElementById('editUserForm').action =
        `/companies/${data.companyId}/admins/${data.adminId}/users/${userId}/edit?_method=PATCH`;
    }