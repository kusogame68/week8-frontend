const api_path = "kusogame68";
const baseUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}`;
const errorMessage = (title, error) => Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: title,
        text: error.response? error.response.data.message || error.response.status: error.message
    });
const commonMessage = (title, icon = "success") => Swal.fire({
        toast: true,
        position: "top-end",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true
    });
const confirmMessage = (title) => Swal.fire({
        toast: true,
        title: title,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085D6",
        cancelButtonColor: "#DD3333",
        confirmButtonText: "是的",
        cancelButtonText: "取消"
    });

const message = {errorMessage, commonMessage, confirmMessage};

// init 
const init = () => {
    getProductList();
    getCartList();
}

// 取得產品列表
const productSelect = document.querySelector(".productSelect");
const productWrap = document.querySelector(".productWrap");
const createProductCard = item => `
    <li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}" alt="">
        <a href="#" class="addCardBtn" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${Number(item.origin_price).toLocaleString()}</del>
        <p class="nowPrice">NT$${Number(item.price).toLocaleString()}</p>
    </li>`;
let productsData = [];

const renderProductList = () => {
    const category = productSelect.value;
    const productList = (category === "全部")? productsData: productsData.filter(item => item.category === category);
    productWrap.innerHTML = productList.map(item => createProductCard(item)).join("");
}

const getProductList = async () => {
    try{
        const res = await axios.get(`${baseUrl}/products`);
        productsData = res.data.products;
        renderProductList();
    }
    catch (error){
        message.errorMessage("取得產品錯誤", error);
    }
};

productSelect.addEventListener("change", renderProductList);

// 取得購物車列表
const shoppingCartTableTbody = document.querySelector(".shoppingCart-table tbody");
const totalPrice = document.querySelector(".totalPrice");
let cartData = {};

const generateCartStr = () => cartData.carts.map(item => {
    const total = item.product.price * item.quantity;
    return `<tr>
        <td>
            <div class="cardItem-title">
                <img src="${item.product.images}" alt="">
                <p>${item.product.title}</p>
            </div>
        </td>
        <td>NT$${item.product.price.toLocaleString()}</td>
        <td>${item.quantity}</td>
        <td>NT$${total.toLocaleString()}</td>
        <td class="discardBtn">
            <a href="#" class="material-icons" data-cart-id="${item.id}">
                clear
            </a>
        </td>
    </tr>`;
}).join("");

const renderCartList = () => {
    totalPrice.textContent = `NT$${cartData.finalTotal.toLocaleString() || 0}`;
    shoppingCartTableTbody.innerHTML = generateCartStr();
}

const getCartList = async () => {
    try{
        const res = await axios.get(`${baseUrl}/carts`);
        cartData = res.data;
        renderCartList();
    }
    catch (error){
        message.errorMessage("取得購物車錯誤", error);
    }
};

// 加入購物車
const addCartItem = async (productId) => {
    const checkItem = cartData.carts.find(item => item.product.id === productId);
    const obj = {
        data: {
            "productId": productId,
            "quantity": (checkItem === undefined)? 1: checkItem.quantity + 1
        }
    };
        
    try{
        const res = await axios.post(`${baseUrl}/carts`, obj);
        cartData = res.data;

        const productTitle = cartData.carts.find(item => item.product.id === productId).product.title;

        renderCartList();
        message.commonMessage(`${productTitle}\n已加入購物車`);
    }
    catch (error){
        message.errorMessage("加入購物車錯誤", error);
    }
}

const productWrapListener = e => {
    e.preventDefault();
    const addCardBtn = e.target.closest(".addCardBtn");
    if (!addCardBtn) return;
    addCartItem(addCardBtn.dataset.id);
}

productWrap.addEventListener("click", productWrapListener);

// 清除購物車內全部產品
const discardAllBtn = document.querySelector(".discardAllBtn");

const deleteAllCartList = async () => {
    try{
        const res = await axios.delete(`${baseUrl}/carts`);
        cartData = res.data;

        message.commonMessage("購物車已清空");
        renderCartList();
    }
    catch (error){
        message.errorMessage("清空購物車錯誤", error);
    }
}

const discardAllBtnListener = async e => {
    e.preventDefault();
    if (!cartData.carts.length) {
            message.commonMessage("購物車目前是空的", "info");
            return;
        }

    const res = await message.confirmMessage("確定清空購物車 ?");
    if (res.isConfirmed) deleteAllCartList();
};

discardAllBtn.addEventListener("click", discardAllBtnListener);

// 刪除購物車內特定產品
const deleteCartItem = async cartId => {
    try{
        const res = await axios.delete(`${baseUrl}/carts/${cartId}`);
        cartData = res.data;

        message.commonMessage("刪除成功");
        renderCartList();
    }
    catch (error){
        message.errorMessage("刪除錯誤", error);
    }
}

const shoppingCartTableTbodyListener = async e => {
    e.preventDefault();
    const cartId = e.target.dataset.cartId;
    if (cartId) deleteCartItem(cartId);
}

shoppingCartTableTbody.addEventListener("click", shoppingCartTableTbodyListener);

// 送出購買訂單
const orderInfoBtn = document.querySelector(".orderInfo-btn");
const customerName = document.querySelector("#customerName");
const customerPhone = document.querySelector("#customerPhone");
const customerEmail = document.querySelector("#customerEmail");
const customerAddress = document.querySelector("#customerAddress");
const tradeWay = document.querySelector("#tradeWay");

const orderInfoForm = document.querySelector(".orderInfo-form");
const orderInfoInput = document.querySelectorAll(".orderInfo-input");

const verify = target => {
    let result = "";
    const messageEl = document.querySelector(`[data-message="${target.name}"]`);
    const value = target.value.trim();
    
    if (!value.length) result = "必填";
    else if (target.name === "電話" && !/^09\d{8}$/.test(value.replaceAll("-", ""))) result = "格式不正確";
    else if (target.name === "Email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) result = "格式不正確";
    else result = "";
    
    if (messageEl) messageEl.textContent = result;
    return result === "";
};

const debounce = target => {
    clearTimeout(target.timer);
    target.timer = setTimeout(() => {
        verify(target);
    }, 500);
};

const orderInfoFormListener = e => {
    if (!e.target.classList.contains("orderInfo-input")) return;
    debounce(e.target);
};

orderInfoForm.addEventListener("input", orderInfoFormListener);

const createOrder = async () => {
    const isVerified = [...orderInfoInput].map(verify).every(Boolean);
    if (!isVerified) return;

    try{
        await axios.post(`${baseUrl}/orders`,
            {
                "data": {
                    "user": {
                        "name": customerName.value.trim(),
                        "tel": customerPhone.value.trim(),
                        "email": customerEmail.value.trim(),
                        "address": customerAddress.value.trim(),
                        "payment": tradeWay.value
                    }
                }
            }
        )
        await getCartList();
        message.commonMessage(`訂單發送成功`);
    }
    catch (error){
        message.errorMessage("送出訂單錯誤", error);
    }

    orderInfoForm.reset();
}

orderInfoBtn.addEventListener("click", createOrder);

init();