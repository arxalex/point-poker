Vue.component('member', {
    template: '#member-template',
    methods: {
        deleteMember(linkid) {
            app.deleteLink(linkid).then(() => {
                app.get(app.sessionData.teamid);
            });
        },
        show(){
            return app.sessionData.data.displayed;
        },
        displayDelete() {
            if (app.ishost) {
                if (app.sessionData.data) {
                    return !app.sessionData.data.displayed;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }  
    },
    props: {
        member: {
            type: Object,
        }
    },
    computed: {
        score: function () {
            return this.member.rate != -1 ? this.member.rate : "?";
        },
              
    },
});
var app = new Vue({
    el: '#page-wrapper',
    data: {
        device: '',
        sessionData: {
            teamid: '',
            id: '',
            pass: '',
            data: {
                hostid: '',
                displayed: false,
            },
        },
        incorrect: false,
        registered: false,
        registration: false,
        login: false,
        member: {
            memberid: '',
            id: '',
            pass: '',
        },
        links: [],
        rate: null,
    },
    methods: {
        getSession: function (id, pass) {
            return axios.post('get.php', {
                table: 'pp_sessions',
                query: {
                    id: id,
                    pass: pass
                }
            }).then((response) => {
                if (response.data.length > 0) {
                    return response.data;
                } else {
                    return false;
                }
            });
        },
        getMember: function (id, pass) {
            return axios.post('get.php', {
                table: 'pp_members',
                query: {
                    id: id,
                    pass: pass
                }
            }).then((response) => {
                if (response.data.length > 0) {
                    return response.data;
                } else {
                    return false;
                }
            });
        },
        getLinks: function () {
            return axios.post('get.php', {
                table: 'pp_link',
                query: {
                    id: this.sessionData.id,
                    pass: this.sessionData.pass
                }
            }).then((response) => {
                if (response.data.length > 0) {
                    return response.data;
                } else {
                    return false;
                }
            });
        },
        createSession: function () {
            return axios.post('create.php', {
                table: 'pp_sessions',
                query: {
                    'id': 'DEFAULT',
                    'pass': generateRandomString(6),
                    'data': JSON.stringify(this.sessionData.data),
                },
            }).then((response) => {
                return response.data;
            });
        },
        createMember: function () {
            return axios.post('create.php', {
                table: 'pp_members',
                query: {
                    'id': 'DEFAULT',
                    'pass': generateRandomString(6),
                    'email': this.member.email,
                    'phone': this.member.phone,
                    'first_name': this.member.first_name,
                    'last_name': this.member.last_name,
                },
            }).then((response) => {
                return response.data;
            });
        },
        createLink: function () {
            return axios.post('create.php', {
                table: 'pp_link',
                query: {
                    'id': this.sessionData.id,
                    'pass': this.sessionData.pass,
                    'memberid': this.member.id,
                    'linkid': 'DEFAULT',
                    'name': this.member.first_name,
                    'rate': this.rate
                },
            }).then((response) => {
                return response.data;
            });
        },
        saveSession() {
            axios.post('update.php', {
                table: 'pp_sessions',
                query: {
                    'id': this.sessionData.id,
                    'pass': this.sessionData.pass,
                    'data': JSON.stringify(this.sessionData.data)
                },
            }).then((response) => {
                if (response.data.response) {
                    this.saveSessionlocal();
                }
            });
        },
        saveMember() {
            axios.post('update.php', {
                table: 'pp_members',
                query: {
                    'id': this.member.id,
                    'pass': this.member.pass,
                    'email': this.member.email,
                    'phone': this.member.phone,
                    'first_name': this.member.first_name,
                    'last_name': this.member.last_name,
                },
            }).then((response) => {
                if (response.data.response) {
                    if (this.memberinlink !== false) {
                        this.deleteLink(this.links[this.memberinlink].linkid);
                        this.join();
                    }
                    this.saveMemberlocal();
                    this.registration = false;
                }
            });
        },
        saveMyLink() {
            axios.post('update.php', {
                table: 'pp_link',
                query: {
                    'id': this.sessionData.id,
                    'pass': this.sessionData.pass,
                    'memberid': this.member.id,
                    'name': this.member.first_name,
                    'rate': this.rate,
                },
            }).then((response) => {
                if (response.data.response) {
                    this.get(this.sessionData.teamid);
                    return true;
                } else {
                    return false;
                }
            });
        },
        saveSessionlocal() {
            localStorage.setItem('device', this.device);
            const parsed = JSON.stringify(this.sessionData);
            localStorage.setItem('pp_sessionData', parsed);
        },
        saveMemberlocal: function () {
            const parsed = JSON.stringify(this.member);
            localStorage.setItem('pp_member', parsed);
        },
        deleteLink(linkid) {
            return axios.post('delete.php', {
                table: 'pp_link',
                query: {
                    id: this.sessionData.id,
                    pass: this.sessionData.pass,
                    linkid: linkid
                }
            }).then((response) => {
                return response.data.response;
            });
        },
        create: function () {
            this.sessionData.data.hostid = this.device;
            this.sessionData.data.displayed = false;
            this.createSession().then((data) => {
                if (data.response == true) {
                    this.sessionData.id = data.id;
                    this.sessionData.pass = data.pass;
                    this.sessionData.teamid = data.id + data.pass;
                    this.login = true;
                    this.incorrect = false;
                    this.saveSessionlocal();
                }
            });
        },
        get: function (teamid) {
            this.getSession(teamid.slice(0, -6), teamid.slice(-6)).then((data) => {
                if (data != false) {
                    this.sessionData.id = data[0].id;
                    this.sessionData.pass = data[0].pass;
                    this.sessionData.data = JSON.parse(data[0].data);
                    this.login = true;
                    this.incorrect = false;
                    this.saveSessionlocal();
                    this.getLinks().then((links) => {
                        this.links = links;
                        if(this.memberinlink !== false){
                            this.rate = this.getMyRate();
                        }
                    });
                } else {
                    this.login = false;
                    this.incorrect = true;
                }
            });
        },
        createM: function () {
            return this.createMember().then((data) => {
                if (data.response == true) {
                    this.member.id = data.id;
                    this.member.pass = data.pass;
                    this.member.memberid = data.id + data.pass;
                    this.saveMemberlocal();
                    this.registration = false;
                }
            })
        },
        getMyRate: function () {
            if (this.links.length > 0) {
                var index = false;
                for (var i = 0; i < this.links.length && index === false; i++)
                {
                    index = this.links[i].memberid == this.member.id ? i : false;
                }
                return this.links[index].rate;
            }
        },
        getM: function (memberid) {
            this.getSession(memberid.slice(0, -6), memberid.slice(-6)).then((data) => {
                if (data != false) {
                    this.member.id = data[0].id;
                    this.member.pass = data[0].pass;
                    this.member.email = data[0].email;
                    this.member.phone = data[0].phone;
                    this.member.first_name = data[0].first_name;
                    this.member.last_name = data[0].last_name;
                    this.saveSessionlocal();
                } else {

                }
            });
        },
        saveM: function () {
            if (this.registration) {
                if (this.member.memberid != '') {
                    this.saveMember();
                } else {
                    this.createM().then(() => {
                        if (this.member.memberid != '') {
                            this.join(this.memberid);
                        }
                    });
                }
            }
        },
        join: function (memberid) {
            if (memberid != '') {
                this.createLink().then(() => {
                    this.get(this.sessionData.teamid);
                });
            } else {
                this.registration = true;
            }
        },
        show: function () {
            this.sessionData.data.displayed = true;
            this.saveSession();
            this.get(this.sessionData.teamid);
        },
        hide: function () {
            this.sessionData.data.displayed = false;
            this.saveSession();
            this.get(this.sessionData.teamid);
        }
    },
    mounted() {
        if (localStorage.getItem('pp_sessionData')) {
            try {
                this.sessionData = JSON.parse(localStorage.getItem('pp_sessionData'));
            } catch (e) {
                localStorage.removeItem('pp_sessionData');
            }
        }
        this.device = generateRandomString(6);
        if (localStorage.getItem('device')) {
            try {
                this.device = localStorage.getItem('device');
            } catch (e) {
                localStorage.removeItem('device');
            }
        }
        if (localStorage.getItem('pp_member')) {
            try {
                this.member = JSON.parse(localStorage.getItem('pp_member'));
            } catch (e) {
                localStorage.removeItem('pp_member');
            }
        }
        setTimeout(() => {
            let timerId = setInterval(() => {
                if (this.login) {
                    this.get(this.sessionData.teamid);
                }
            }, 2000)
        }, 100);
        var params = getParams();
        if (params.teamid != null) {
            this.sessionData = {
                teamid: params.teamid,
            }
            this.get(this.sessionData.teamid);
        }
        if (params.memberid != null) {
            this.member = {
                memberid: params.memberid,
            }
            this.getM(this.member.memberid);
        }
        this.displayDreamerModel = false;
    },
    computed: {
        link: function () {
            return 'https://apps.arxalex.com/point-poker?teamid=' + this.sessionData.teamid;
        },
        qrsrc: function () {
            return "https://api.qrserver.com/v1/create-qr-code/?data=" + this.link + "&amp;size=100x100";
        },
        ishost: function () {
            if (this.sessionData.data) {
                return this.device == this.sessionData.data.hostid;
            } else {
                return false;
            }
        },
        memberinlink: function () {
            if (this.links.length != null && this.member.id != null) {
                var isit = false;
                var i = 0;
                for (i = 0; i < this.links.length && !isit; i++) {
                    isit = this.links[i].memberid == this.member.id;
                }
                if (isit) {
                    return i - 1;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        disableShowing: function () {
            return this.links.length == null || this.links.length < 0;
        },
        score: function () {
            return this.member.rate !== -1 ? this.member.rate : "?";
        },
        avg: function() {
            var s = 0;
            var c = 0;
            this.links.forEach(element => {
                s += element.rate >= 0 ? parseInt(element.rate) : 0;
                c += element.rate >= 0 ? 1 : 0;
            });
            return Math.round10(s/c, -1);
        },
        min: function() {
            var m = this.max;
            this.links.forEach(element => {
                m = element.rate >= 0 && element.rate < m ? parseInt(element.rate) : m; 
            })
            return m;
        },
        max: function() {
            var m = 0;
            this.links.forEach(element => {
                m = element.rate >= 0 && element.rate > m ? parseInt(element.rate) : m; 
            })
            return m;
        }
    },
    watch: {
        rate: function (value) {
            this.rate = value;
            this.saveMyLink();
        }
    },
    created: function () {
        this.registered = this.member.memberid != '';
    }
});
function generateRandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function getParams() {
    queryString = window.location.search;
    urlParams = new URLSearchParams(queryString);
    return {
        teamid: urlParams.get('teamid'),
        memberid: urlParams.get('memberid')
    }
}
(function() {
    /**
     * Корректировка округления десятичных дробей.
     *
     * @param {String}  type  Тип корректировки.
     * @param {Number}  value Число.
     * @param {Integer} exp   Показатель степени (десятичный логарифм основания корректировки).
     * @returns {Number} Скорректированное значение.
     */
    function decimalAdjust(type, value, exp) {
      // Если степень не определена, либо равна нулю...
      if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
      }
      value = +value;
      exp = +exp;
      // Если значение не является числом, либо степень не является целым числом...
      if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
      }
      // Сдвиг разрядов
      value = value.toString().split('e');
      value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
      // Обратный сдвиг
      value = value.toString().split('e');
      return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }
  
    // Десятичное округление к ближайшему
    if (!Math.round10) {
      Math.round10 = function(value, exp) {
        return decimalAdjust('round', value, exp);
      };
    }
    // Десятичное округление вниз
    if (!Math.floor10) {
      Math.floor10 = function(value, exp) {
        return decimalAdjust('floor', value, exp);
      };
    }
    // Десятичное округление вверх
    if (!Math.ceil10) {
      Math.ceil10 = function(value, exp) {
        return decimalAdjust('ceil', value, exp);
      };
    }
  })();

