Vue.filter('datetime', function (value, fmt) {
    return value.format(fmt || 'yyyy-MM-dd hh:mm')
});

var ordersVue = new Vue({
        el: "#app",

        data: {
            orders: [],
            newBidOrders: [],
            newAskOrders: [],
            dealOrders: []
        },

        init: this.fetchOrders,

        ready: function () {
            setInterval(this.fetchOrders, 2000);
        },
        filters: {
            makeOrder: function (arr) {
                var result = arr;
                if (arr) {
                    result = arr.filter(function (item) {
                        for (index in arr) {
                            var order = arr[index];
                            if (order.number != item.number && order.side != item.side) {

                            }
                        }


                        return false;
                    }.bind(this));
                }
                return result;
            }
        },

        methods: {

            getBidOrder: function () {
                var arr = this.getSideArr('bid');
                if (arr) {
                    arr.sort(function (a, b) {
                        return a.price < b.price ? 1 : a.price == b.price ? 0 : -1;
                    });
                }
                return arr;
            },
            getAskOrder: function () {
                var arr = this.getSideArr('ask');
                if (arr) {
                    arr.sort(function (a, b) {
                        return a.price > b.price ? 1 : a.price == b.price ? 0 : -1;
                    });
                }
                return arr;
            },
            getSortOrder: function (arr, pro, type) {
                if (arr) {
                    arr.sort(function (a, b) {
                        return (type != 'desc' ? a[pro] > b[pro] : a[pro] < b[pro]) ? 1 : a[pro] == b[pro] ? 0 : -1;
                    });
                }
                return arr;
            },

            getResult: function () {
                var self = this;
                var bidOrders = this.getBidOrder();
                var askOrders = this.getAskOrder();
                for (var index in askOrders) {
                    var askOrder = askOrders[index];
                    var isDeal = false;
                    if (!askOrder.isDelete) {
                        for (var i in bidOrders) {
                            var bidOrder = bidOrders[i];
                            if (!bidOrder.isDelete) {
                                if (askOrder.price <= bidOrder.price) {
                                    var dealQuantity = bidOrder.quantity;
                                    if (askOrder.quantity > bidOrder.quantity) {

                                        askOrder.quantity = askOrder.quantity - bidOrder.quantity;
                                        bidOrder.isDelete = true;
                                        var index = this.arrayContain(this.newBidOrders, bidOrder);
                                        if (index >= 0) {

                                            this.newBidOrders.splice(index, 1);

                                        }

                                    }
                                    else if (askOrder.quantity < bidOrder.quantity) {
                                        dealQuantity = askOrder.quantity;
                                        bidOrder.quantity = bidOrder.quantity - askOrder.quantity;
                                        askOrder.isDelete = true;

                                        var index = this.arrayContain(this.newAskOrders, askOrder);
                                        if (index >= 0) {

                                            this.newAskOrders.splice(index, 1);

                                        }

                                    }
                                    else {
                                        dealPrice = (askOrder.price + bidOrder.price) / 2;
                                        askOrder.isDelete = true;
                                        bidOrder.isDelete = true;
                                        var index = this.arrayContain(this.newAskOrders, askOrder);
                                        if (index >= 0) {

                                            this.newAskOrders.splice(index, 1);

                                        }
                                        index = this.arrayContain(this.newBidOrders, bidOrder);
                                        if (index >= 0) {

                                            this.newBidOrders.splice(index, 1);

                                        }
                                    }
                                    if (this.dealOrders.length >= 30) {
                                        this.dealOrders.pop();
                                    }
                                    this.dealOrders.unshift({
                                        time: new Date().format('yyyy-MM-dd hh:mm:ss'),
                                        quantity: dealQuantity,
                                        price: (askOrder.price + bidOrder.price) / 2,
                                        askOrder: askOrder,
                                        bidOrder: bidOrder
                                    });
                                    isDeal = true;
                                }
                                else {
                                    if (this.arrayContain(this.newBidOrders, bidOrder) < 0 && bidOrder.quantity > 0) {

                                        this.newBidOrders.push(bidOrder);

                                    }
                                }
                            }
                            if (askOrder.quantity <= 0) {
                                break;
                            }
                        }
                    }

                    if (!isDeal) {
                        var newAsk = askOrders.slice(index);
                        for (var i = 0; i < newAsk.length; i++) {
                            if (this.arrayContain(this.newAskOrders, newAsk[i]) < 0 && newAsk[i].quantity > 0) {

                                this.newAskOrders.push(newAsk[i]);

                            }
                        }
                        break;
                    }
                    isDeal = false;
                }
                this.newBidOrders = this.sliceArr(this.getSortOrder(this.newBidOrders, 'price', 'desc'), 20);
                this.newAskOrders = this.sliceArr(this.getSortOrder(this.newAskOrders, 'price', 'desc'), 20);
                this.dealOrders = this.sliceArr(this.dealOrders, 30);

                ordersVue.$set('dealOrders', this.dealOrders);


            },
            sliceArr: function (arr, count) {
                if (arr.length >= count) {
                    arr = arr.slice(0, count);

                }
                return arr;
            },
            arrayContain: function (arr, obj) {
                if (arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i].number === obj.number) {
                            return i;
                        }
                    }
                }
                return -1;
            },

            getSideArr: function (side) {
                var arr = [];
                if (this.orders) {

                    for (index in this.orders) {
                        var order = this.orders[index];
                        if (order.side == side) {
                            arr.push(order);
                        }
                    }

                }
                return arr;
            },
            toggleDealOrder: function (order) {
                if (!order.show) {
                    Vue.set(order, 'show', true)
                }
                else {
                    Vue.set(order, 'show', false)
                }
            },
            fetchOrders: function () {
                var self = this;
                $.ajax({
                    type: "GET",
                    url: "/listOrders",
                    dataType: "json",
                    data: {
                        "start": "10",
                        "size": "100"
                    },
                    success: function (resp) {
                        // console.log(resp);
                        self.orders = resp;
                        self.getResult();
                    },
                    error: function (jqXHR, exception) {
                        console.log("Failed to get chain height!");
                        self.orders = [];
                    }
                });
            }
        }
    })
    ;

(function reset() {
    $.ajax({
        type: "GET",
        url: "/reset"
    })
})();


Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
