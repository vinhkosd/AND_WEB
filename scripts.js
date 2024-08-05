const apiUrl = "http://localhost:3000/";
const categoryDropdown = document.getElementById("dropdownCategoryChild");
// Lấy danh sách thể loại từ server
const bookList = document.getElementById("book-list");
const cart = document.getElementById("cart");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const registerBtn = document.getElementById("registerBtn");
const profileBtn = document.getElementById("profileBtn");
const cartBtn = document.getElementById("cartBtn");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
var provinceSelect = document.getElementById("provinceSelect");
var districtSelect = document.getElementById("districtSelect");
var wardSelect = document.getElementById("wardSelect");
var addressSubmitBtn = document.getElementById("addressSubmitBtn");
var addressUpdateBtn = document.getElementById("addressUpdateBtn");
var submitCarts = document.getElementById("submitCarts");

var bookCacheds = [];
var savedShippingAddresses = [];
document.addEventListener("DOMContentLoaded", () => {
    fetch(apiUrl + "category")
        .then(response => response.json())
        .then(data => {
            data.forEach(category => {
                //<a class="dropdown-item" href="#">Action</a>
                const categoryOption = document.createElement("a");
                categoryOption.classList.add("dropdown-item");
                categoryOption.href = "#";
                categoryOption.innerText = category.categoryName;
                categoryOption.onclick = function () {
                    loadBooks(category._id);
                };
                categoryDropdown.appendChild(categoryOption);
            });
        });



    // Lấy danh sách sách từ server
    window.loadBooks();

    if(getUser()){

        $(loginBtn).addClass("d-none");
        $(registerBtn).addClass("d-none");
        $(profileBtn).removeClass("d-none");
        $(logoutBtn).removeClass("d-none");        
    } else {
        $(loginBtn).removeClass("d-none");
        $(registerBtn).removeClass("d-none");
        $(profileBtn).addClass("d-none");
        $(logoutBtn).addClass("d-none");
    }

    logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Đăng xuất thành công");
        $(loginBtn).removeClass("d-none");
        $(registerBtn).removeClass("d-none");
        $(profileBtn).addClass("d-none");
        $(logoutBtn).addClass("d-none");
    });

    loginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var myModal = new bootstrap.Modal(document.getElementById("loginModal"));
        myModal.show();
    });

    frmLoginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        loginHandler();
    });

    cartBtn.addEventListener("click", function (e) {
        e.preventDefault();
        loadCart();

        var myModal = new bootstrap.Modal(document.getElementById("cartModal"));
        myModal.show();
    })

    cartCheckoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if(!getUser()){
            alert("Vui lòng đăng nhập để tiếp tục");
            return;
        }
        var cartItems = [];
        if (localStorage.getItem("cart")) {
            cartItems = JSON.parse(localStorage.getItem("cart"));
        }
        var totalCartMoney = 0;
        cartItems.forEach(item => {
            var book = bookCacheds.find(book => book._id === item.bookId);
            if (!book) {
                return;
            }
            totalCartMoney += book.price * item.quantity;
        });

        if(totalCartMoney <= 0){
            alert("Giỏ hàng trống, vui lòng thêm sách vào giỏ hàng");
            return;
        }
        
        var myModal = new bootstrap.Modal(document.getElementById("cartModal"));
        myModal.hide();

        var myModal = new bootstrap.Modal(document.getElementById("addressModal"));
        myModal.show();
    });

    provinceSelect.addEventListener("change", function (e) {
        e.preventDefault();
        var provinceId = provinceSelect.value;
        listDistrict(provinceId);
    });

    districtSelect.addEventListener("change", function (e) {
        e.preventDefault();
        var districtId = districtSelect.value;
        listWard(districtId);
    });

    addressSubmitBtn.addEventListener("click", function (e) {
        e.preventDefault();
        saveAddress();
    });

    submitCarts.addEventListener("click", function (e) {
        e.preventDefault();
        var cartItems = [];
        var orderDetails = [];
        if (localStorage.getItem("cart")) {
            cartItems = JSON.parse(localStorage.getItem("cart"));
        }
        var totalCartMoney = 0;
        cartItems.forEach(item => {
            var book = bookCacheds.find(book => book._id === item.bookId);
            if (!book) {
                return;
            }
            orderDetails.push({bookId: book._id, quantity: item.quantity});
            totalCartMoney += book.price * item.quantity;
        });
        if(totalCartMoney <= 0){
            alert("Giỏ hàng trống, vui lòng thêm sách vào giỏ hàng");
            return;
        }

        var addressId = document.getElementById("savedAddressSelector").value;
        
        if(addressId == -1){
            alert("Vui lòng chọn địa chỉ giao hàng");
            return;
        }

        var myHeaders = new Headers();
        myHeaders.append("authorization", "Bearer " + localStorage.getItem("token"));
        myHeaders.append("Content-Type", "application/json");
        fetch(apiUrl + "user/buyBook", {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify({
                addressId,
                orderDetails
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Đặt hàng thành công");
                    localStorage.removeItem("cart");
                    loadCart();
                    loadBooks();

                    var myModal = new bootstrap.Modal(document.getElementById("addressModal"));
                    myModal.hide();
                } else {
                    alert(data.message);
                }
            });
    
    });

    listProvince();

    loadShippingAddress();
});

window.saveAddress = function () {
    var newAddressFrm = document.getElementById("newAddressFrm");
    var addressLine1 = newAddressFrm.address.value;
    var provinceId = provinceSelect.value;
    var districtId = districtSelect.value;
    var wardId = wardSelect.value;
    var user = getUser();
    var phoneNumber = newAddressFrm.phone.value;
    var shippingNote = newAddressFrm.note.value;
    var receiverName = newAddressFrm.receiver.value;
    if (!user) {
        alert("Vui lòng đăng nhập!");
        return;
    }   

    var myHeaders = new Headers();
    myHeaders.append("authorization", "Bearer " + localStorage.getItem("token"));
    myHeaders.append("Content-Type", "application/json");
    fetch(apiUrl + "user/saveShippingAddress", {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({
            addressLine1,
            provinceId,
            districtId,
            wardId,
            phoneNumber,
            shippingNote,
            receiverName,
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Thêm địa chỉ giao hàng thành công");
                loadShippingAddress();
            } else {
                alert(data.msg);
            }
        });
}
window.loadShippingAddress = function () {
    var savedAddressSelector = document.getElementById("savedAddressSelector");
    
    var user = getUser();
    if (!user) {
        return;
    }

    var myHeaders = new Headers();
    myHeaders.append("authorization", "Bearer " + localStorage.getItem("token"));

    var requestOptions = {
        headers: myHeaders,
    };

    fetch(apiUrl + `user/getShippingAddress`, requestOptions)
        .then(response => response.json())
        .then(data => {
            if(!data.success) {
                alert("Không thể lấy danh sách địa chỉ giao hàng, vui lòng thử lại");
                return;
            }
            savedShippingAddresses = data.shippingAddress;
            savedAddressSelector.innerHTML = "";

            var option = document.createElement("option");
                option.value = -1;
                option.innerText = 'Chọn địa chỉ giao hàng đã lưu';
            savedAddressSelector.appendChild(option);
            
            data.shippingAddress.forEach(address => {
                var wardName = address.wardId ? address.wardId.wardName : "";
                var districtName = address.wardId ? address.wardId.districtId.districtName : "";
                var provinceName = address.wardId ? address.wardId.districtId.provinceId.provinceName : "";
                var option = document.createElement("option");
                option.value = address._id;
                option.innerText = address.addressLine1 + ", " + wardName + ", " + districtName + ", " + provinceName;
                savedAddressSelector.appendChild(option);
            });
        }
    );

    savedAddressSelector.addEventListener("change", function (e) {
        e.preventDefault();

        if(savedAddressSelector.value == -1){ 
            var newAddressFrm = document.getElementById("newAddressFrm");
            newAddressFrm.address.value = null;
            newAddressFrm.phone.value = null;
            newAddressFrm.note.value = null;
            newAddressFrm.receiver = null;
            provinceSelect.value = null;
            districtSelect.value = null;
            wardSelect.value = null;
            $(addressUpdateBtn).addClass("d-none");
            return; 
        }

        var selectedAddress = savedShippingAddresses.find(address => address._id === savedAddressSelector.value);
        if (!selectedAddress) {
            return;
        }
        $(addressUpdateBtn).removeClass("d-none");
        var newAddressFrm = document.getElementById("newAddressFrm");
        newAddressFrm.address.value = selectedAddress.addressLine1;
        newAddressFrm.phone.value = selectedAddress.phoneNumber;
        newAddressFrm.note.value = selectedAddress.shippingNote;
        newAddressFrm.receiver.value = selectedAddress.receiverName;
        provinceSelect.value = selectedAddress.wardId.districtId.provinceId._id;
        listDistrict(selectedAddress.wardId.districtId.provinceId._id);
        districtSelect.value = selectedAddress.wardId.districtId._id;
        listWard(selectedAddress.wardId.districtId._id);
        wardSelect.value = selectedAddress.wardId._id;
    });
};

window.toggleNewAddressFrm = function () {
    var newAddressFrm = document.getElementById("newAddressFrm");
    if (newAddressFrm.classList.contains("d-none")) {
        newAddressFrm.classList.remove("d-none");
    } else {
        newAddressFrm.classList.add("d-none");
    }
};

window.listProvince = function () {
    
    provinceSelect.innerHTML = "";
    fetch(apiUrl + "province")
        .then(response => response.json())
        .then(data => {
            if(!data.success) {
                alert("Không thể lấy danh sách tỉnh thành, vui lòng thử lại");
                return;
            }
            data.provinces.forEach(province => {
                var option = document.createElement("option");
                option.value = province._id;
                option.innerText = province.provinceName;
                option.addEventListener("click", function () {
                    listDistrict(province._id);
                });
                provinceSelect.appendChild(option);
            });
        });
};

window.listDistrict = function (provinceId = null) {
    var listDistrictRoute = "district";
    if (provinceId) {
        listDistrictRoute = `province/${provinceId}/district`;
    }
    var districtSelect = document.getElementById("districtSelect");
    districtSelect.innerHTML = "";
    fetch(apiUrl + listDistrictRoute)
        .then(response => response.json())
        .then(data => {
            if(!data.success) {
                alert("Không thể lấy danh sách quận huyện, vui lòng thử lại");
                return;
            }
            data.districts.forEach(district => {
                var option = document.createElement("option");
                option.value = district._id;
                option.innerText = district.districtName;
                districtSelect.appendChild(option);
            });
        });
}

window.listWard = function (districtId = null) {
    var listWardRoute = "ward";
    if (districtId) {
        listWardRoute = `district/${districtId}/ward`;
    }
    var wardSelect = document.getElementById("wardSelect");
    wardSelect.innerHTML = "";
    fetch(apiUrl + listWardRoute)
        .then(response => response.json())
        .then(data => {
            if(!data.success) {
                alert("Không thể lấy danh sách phường xã, vui lòng thử lại");
                return;
            }
            data.wards.forEach(ward => {
                var option = document.createElement("option");
                option.value = ward._id;
                option.innerText = ward.wardName;
                wardSelect.appendChild(option);
            });
        });
};

window.loadCart = function () {
    var cartItems = [];
    if (localStorage.getItem("cart")) {
        cartItems = JSON.parse(localStorage.getItem("cart"));
    }
    var totalCartMoney = 0;
    var cartTable = document.getElementById("cartTable");
    cartTable.innerHTML = "";
    cartItems.forEach(item => {
        var book = bookCacheds.find(book => book._id === item.bookId);
        if (!book) {
            return;
        }
        var cartRow = document.createElement("tr");
        totalCartMoney += book.price * item.quantity;
        cartRow.innerHTML = `
        <td>${book.title}</td>
        <td>${book.price} VND</td>
        <td>${item.quantity}</td>
        <td>${parseFloat(book.price * item.quantity).toFixed(2)} VND</td>
        <td><button class="btn btn-danger" onclick="removeFromCart('${book._id}')">Xóa</button></td>
        `;
        cartTable.appendChild(cartRow);
    }); 

    cartTotal.innerText = "Tổng tiền: " + totalCartMoney + " VND";

   
};

window.loginHandler = function () {
    var frmLogin = document.getElementById("frmLogin");
    var email = frmLogin.email.value;
    var password = frmLogin.password.value;
    fetch(apiUrl + "user/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                alert("Đăng nhập thành công");

                $(loginBtn).addClass("d-none");
                $(registerBtn).addClass("d-none");
                $(profileBtn).removeClass("d-none");
                $(logoutBtn).removeClass("d-none");    
            } else {
                alert(data.message);
            }
        }).catch(err => {
            console.log(err);
            alert("Không thể đăng nhập, vui lòng thử lại");
        });
}

window.getUser = function () {
    if (localStorage.getItem("user")) {
        return JSON.parse(localStorage.getItem("user"));
    }
    return null;
};

window.validToken = async function () {
    if (localStorage.getItem("token")) {
        var tokenValid = false;
        await new Promise(resolve => {
            fetch(apiUrl + "auth/valid-token")
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        tokenValid = false;
                    }

                    tokenValid = true;
                    resolve();
                }).catch(err => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    tokenValid = false;
                    resolve();
                })
        });

        return tokenValid;
    }
    return false;
};

window.loadBooks = function (categoryId = null) {
    var bookApiLink = "book";
    if (categoryId) {
        bookApiLink = `book/category/${categoryId}`;
    }
    bookList.innerHTML = "";
    var myHeaders = new Headers();
    myHeaders.append("authorization", "Bearer " + localStorage.getItem("token"));

    var requestOptions = {
        headers: myHeaders,
    };
    fetch(apiUrl + bookApiLink, requestOptions)
        .then(response => response.json())
        .then(data => {

            if (data.success) {
                bookCacheds = data.books;
                data.books.forEach(book => {
                    const bookDiv = document.createElement("div");
                    bookDiv.classList.add("col-md-4");
                    bookDiv.innerHTML = `
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">Tác giả: ${book.author}</p>
                        <p>Thể loại: ${book.categoryId.categoryName}</p>
                        <p>Nhà xuất bản: ${book.publisher}</p>
                        <p>Số lượng sách: ${book.stockQuantity}</p>
                        <p class="card-text">Giá: ${book.price} VND</p>
                        <button class="btn btn-primary" onclick="showAddToCartModal('${book._id}')">Thêm vào giỏ hàng</button>
                    </div>
                </div>
                `;
                    bookList.appendChild(bookDiv);
                });
            }

        });
};

window.showAddToCartModal = function (bookId) {
    var book = bookCacheds.find(book => book._id === bookId);
    if(!book){
        alert("Không tìm thấy sách này, vui lòng thử lại");
        return;
    }

    
    var myModal = new bootstrap.Modal(document.getElementById("addToCartModal"));
    myModal.show();
    var bookDetail = document.getElementById("bookDetail");//book card
    bookDetail.innerHTML = `
    <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">Tác giả: ${book.author}</p>
                        <p>Thể loại: ${book.categoryId.categoryName}</p>
                        <p>Nhà xuất bản: ${book.publisher}</p>
                        <p>Số lượng sách: ${book.stockQuantity}</p>
                        <p class="card-text">Giá: ${book.price} VND</p>
                    </div>
                </div>
    `
    
    document.getElementById("addToCartBtn").onclick = function () {
        var quantity = document.getElementById("cartQuantity").value;
        addToCart(bookId, quantity);
        myModal.hide();
    };
};

// Thêm sách vào giỏ hàng
window.addToCart = function (bookId, quantity = 1) {
    const book = bookCacheds.find(book => book._id === bookId);
    if (!book) {
        alert("Sách không tồn tại");
        return;
    }
    if (book.stockQuantity < quantity) {
        alert("Số lượng sách không đủ");
        return;
    }
    //add to localstorage
    var cartItems = [];
    if (localStorage.getItem("cart")) {
        cartItems = JSON.parse(localStorage.getItem("cart"));
    }
    var cartBook = cartItems.find(item => item.bookId === bookId);
    if(cartItems.find(item => item.bookId === bookId)){
        cartItems.find(item => item.bookId === bookId).quantity = parseInt(cartItems.find(item => item.bookId === bookId).quantity) + parseInt(quantity);
    } else {
        cartItems.push({ bookId, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cartItems));
    document.getElementById("cartQuantity").value = 1;
    alert("Thêm vào giỏ hàng thành công");
};

window.removeFromCart = function (bookId) {
    var cartItems = [];
    if (localStorage.getItem("cart")) {
        cartItems = JSON.parse(localStorage.getItem("cart"));
    }
    cartItems = cartItems.filter(item => item.bookId !== bookId);
    localStorage.setItem("cart", JSON.stringify(cartItems));

    loadCart();
};