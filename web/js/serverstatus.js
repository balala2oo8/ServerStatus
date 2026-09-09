// serverstatus.js. big data boom today.
var error = 0;
var d = 0;
var server_status = new Array();
var stats_summary = ""; // 全部在线节点的汇总：速率与总流量

function fmtRate(bytes) {
	if(bytes < 1024*1024)
		return (bytes/1024).toFixed(1) + "K";
	return (bytes/1024/1024).toFixed(1) + "M";
}

function fmtTraffic(bytes) {
	if(bytes < 1024*1024*1024*1024)
		return (bytes/1024/1024/1024).toFixed(1) + "G";
	return (bytes/1024/1024/1024/1024).toFixed(1) + "T";
}

// 把 unix 秒时间戳格式化为 YYYY-MM-DD HH:MM:SS，空值显示 "-"
function fmtClock(secs) {
	if(!secs)
		return "-";
	var dt = new Date(secs * 1000);
	var pad = function(n) { return (n < 10 ? "0" : "") + n; };
	return dt.getFullYear() + "-" + pad(dt.getMonth()+1) + "-" + pad(dt.getDate()) +
		" " + pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":" + pad(dt.getSeconds());
}

function timeSince(date) {
	if(date == 0)
		return "从未.";

	var seconds = Math.floor((new Date() - date) / 1000);
	var interval = Math.floor(seconds / 60);
	if (interval > 1)
		return interval + " 分钟前.";
	else
		return "几秒前.";
}

function bytesToSize(bytes, precision, si)
{
	var ret;
	si = typeof si !== 'undefined' ? si : 0;
	if(si != 0) {
		var megabyte = 1000 * 1000;
		var gigabyte = megabyte * 1000;
		var terabyte = gigabyte * 1000;
	} else {
		var megabyte = 1024 * 1024;
		var gigabyte = megabyte * 1024;
		var terabyte = gigabyte * 1024;
	}

	if ((bytes >= megabyte) && (bytes < gigabyte)) {
		ret = (bytes / megabyte).toFixed(precision) + ' M';

	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		ret = (bytes / gigabyte).toFixed(precision) + ' G';

	} else if (bytes >= terabyte) {
		ret = (bytes / terabyte).toFixed(precision) + ' T';

	} else {
		return bytes + ' B';
	}
	return ret;
	/*if(si != 0) {
		return ret + 'B';
	} else {
		return ret + 'iB';
	}*/
}

function uptime() {
	$.getJSON("json/stats.json", function(result) {
		$("#loading-notice").remove();
		if(result.reload)
			setTimeout(function() { location.reload() }, 1000);

		for (var i = 0, rlen=result.servers.length; i < rlen; i++) {
			var TableRow = $("#servers tr#r" + i);
			var MableRow = $("#monitors tr#r" + i);
			var ExpandRow = $("#servers #rt" + i);
			var hack; // fuck CSS for making me do this
			if(i%2) hack="odd"; else hack="even";
			if (!TableRow.length) {
				$("#servers").append(
					"<tr id=\"r" + i + "\" data-toggle=\"collapse\" data-target=\"#rt" + i + "\" class=\"accordion-toggle " + hack + "\">" +
						"<td id=\"online_status\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
						"<td id=\"month_traffic\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
						"<td id=\"name\">加载中</td>" +
						"<td id=\"type\">加载中</td>" +
						"<td id=\"location\">加载中</td>" +
						"<td id=\"uptime\">加载中</td>" +
						"<td id=\"load\">加载中</td>" +
						"<td id=\"network\">加载中</td>" +
						"<td id=\"traffic\">加载中</td>" +
						"<td id=\"cpu\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
						"<td id=\"memory\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
						"<td id=\"hdd\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
						"<td id=\"ping\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
					"</tr>" +
					"<tr class=\"expandRow " + hack + "\"><td colspan=\"16\"><div class=\"accordian-body collapse\" id=\"rt" + i + "\">" +
						"<div id=\"expand_ip\">加载中</div>" +
						"<div id=\"expand_mem\">加载中</div>" +
						"<div id=\"expand_hdd\">加载中</div>" +
						"<div id=\"expand_tupd\">加载中</div>" +
						"<div id=\"expand_ping\">加载中</div>" +
					"</div></td></tr>"
				);
				TableRow = $("#servers tr#r" + i);
				ExpandRow = $("#servers #rt" + i);
				server_status[i] = true;
			}
			if (!MableRow.length) {
				$("#monitors").append(
					"<tr id=\"r" + i + "\" data-target=\"#rt" + i + "\" class=\"accordion-toggle " + hack + "\">" +
					"<td id=\"monitor_status\"><div class=\"progress\"><div style=\"width: 100%;\" class=\"progress-bar progress-bar-warning\"><small>加载中</small></div></div></td>" +
					"<td id=\"monitor_node\">加载中</td>" +
					"<td id=\"monitor_location\">加载中</td>" +
					"<td id=\"monitor_text\">加载中</td>" +
					"</tr>"
				);
				MableRow = $("#monitors tr#r" + i);
			}
			TableRow = TableRow[0];
			MableRow = MableRow[0];
			if(error) {
				TableRow.setAttribute("data-target", "#rt" + i);
				MableRow.setAttribute("data-target", "#rt" + i);
				server_status[i] = true;
			}

			// online_status
			if (result.servers[i].online4 && !result.servers[i].online6) {
				TableRow.children["online_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["online_status"].children[0].children[0].innerHTML = "<small>IPv4</small>";
				MableRow.children["monitor_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				MableRow.children["monitor_status"].children[0].children[0].innerHTML = "<small>IPv4</small>";
			} else if (result.servers[i].online4 && result.servers[i].online6) {
				TableRow.children["online_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["online_status"].children[0].children[0].innerHTML = "<small>双栈</small>";
				MableRow.children["monitor_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				MableRow.children["monitor_status"].children[0].children[0].innerHTML = "<small>双栈</small>";
			} else if (!result.servers[i].online4 && result.servers[i].online6) {
			    TableRow.children["online_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["online_status"].children[0].children[0].innerHTML = "<small>IPv6</small>";
				MableRow.children["monitor_status"].children[0].children[0].className = "progress-bar progress-bar-success";
				MableRow.children["monitor_status"].children[0].children[0].innerHTML = "<small>IPv6</small>";
			} else {
				TableRow.children["online_status"].children[0].children[0].className = "progress-bar progress-bar-danger";
				TableRow.children["online_status"].children[0].children[0].innerHTML = "<small>关闭</small>";
				MableRow.children["monitor_status"].children[0].children[0].className = "progress-bar progress-bar-danger";
				MableRow.children["monitor_status"].children[0].children[0].innerHTML = "<small>关闭</small>";
			}

			// Name
			TableRow.children["name"].innerHTML = result.servers[i].name;
			MableRow.children["monitor_node"].innerHTML = result.servers[i].name;

			// Type
			TableRow.children["type"].innerHTML = result.servers[i].type;

			// Location
			TableRow.children["location"].innerHTML = result.servers[i].location;
			MableRow.children["monitor_location"].innerHTML = result.servers[i].location;
			if (!result.servers[i].online4 && !result.servers[i].online6) {
				if (server_status[i]) {
					TableRow.children["uptime"].innerHTML = "–";
					TableRow.children["load"].innerHTML = "–";
					TableRow.children["network"].innerHTML = "–";
					TableRow.children["traffic"].innerHTML = "–";
					TableRow.children["month_traffic"].children[0].children[0].className = "progress-bar progress-bar-danger";
					TableRow.children["month_traffic"].children[0].children[0].innerHTML = "<small>关闭</small>";
					TableRow.children["cpu"].children[0].children[0].className = "progress-bar progress-bar-danger";
					TableRow.children["cpu"].children[0].children[0].style.width = "100%";
					TableRow.children["cpu"].children[0].children[0].innerHTML = "<small>关闭</small>";
					TableRow.children["memory"].children[0].children[0].className = "progress-bar progress-bar-danger";
					TableRow.children["memory"].children[0].children[0].style.width = "100%";
					TableRow.children["memory"].children[0].children[0].innerHTML = "<small>关闭</small>";
					TableRow.children["hdd"].children[0].children[0].className = "progress-bar progress-bar-danger";
					TableRow.children["hdd"].children[0].children[0].style.width = "100%";
					TableRow.children["hdd"].children[0].children[0].innerHTML = "<small>关闭</small>";
					TableRow.children["ping"].children[0].children[0].className = "progress-bar progress-bar-danger";
					TableRow.children["ping"].children[0].children[0].style.width = "100%";
					TableRow.children["ping"].children[0].children[0].innerHTML = "<small>关闭</small>";
					MableRow.children["monitor_text"].innerHTML = "-";
					if(ExpandRow.hasClass("in")) {
						ExpandRow.collapse("hide");
					}
					// 离线时仍保留点击展开：无数据的明细置空，只保留 IP/最后更新行
					ExpandRow[0].children["expand_mem"].innerHTML = "内存|虚存: -";
					ExpandRow[0].children["expand_hdd"].innerHTML = "硬盘|读写: -";
					ExpandRow[0].children["expand_tupd"].innerHTML = "TCP/UDP/进/线: -";
					ExpandRow[0].children["expand_ping"].innerHTML = "CU/CT/CM: -";
					server_status[i] = false;
				}
				// 离线时展开面板里每帧刷新 IP 与最后更新时间（保留 data-target 使行可点击）
				ExpandRow[0].children["expand_ip"].innerHTML = "IP: " + (result.servers[i].ip || "-") + "　最后更新: " + fmtClock(result.servers[i].last_update);
			} else {
				if (!server_status[i]) {
					TableRow.setAttribute("data-target", "#rt" + i);
					MableRow.setAttribute("data-target", "#rt" + i);
					server_status[i] = true;
				}

				// month traffic
				var monthtraffic = "";
				var trafficdiff_in = result.servers[i].network_in - result.servers[i].last_network_in;
				var trafficdiff_out = result.servers[i].network_out - result.servers[i].last_network_out;
				if(trafficdiff_in < 1024*1024*1024*1024)
					monthtraffic += (trafficdiff_in/1024/1024/1024).toFixed(1) + "G";
				else
					monthtraffic += (trafficdiff_in/1024/1024/1024/1024).toFixed(1) + "T";
				monthtraffic += " | "
				if(trafficdiff_out < 1024*1024*1024*1024)
					monthtraffic += (trafficdiff_out/1024/1024/1024).toFixed(1) + "G";
				else
					monthtraffic += (trafficdiff_out/1024/1024/1024/1024).toFixed(1) + "T";
				TableRow.children["month_traffic"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["month_traffic"].children[0].children[0].innerHTML = ""+monthtraffic+"";

				// Uptime
				TableRow.children["uptime"].innerHTML = result.servers[i].uptime;

				// Load: default load_1, you can change show: load_1, load_5, load_15
				if(result.servers[i].load == -1) {
				    TableRow.children["load"].innerHTML = "–";
				} else {
				    TableRow.children["load"].innerHTML = result.servers[i].load_1.toFixed(2);
				}

				// Network
				var netstr = "";
				if(result.servers[i].network_rx < 1024*1024)
					netstr += (result.servers[i].network_rx/1024).toFixed(1) + "K";
				else
					netstr += (result.servers[i].network_rx/1024/1024).toFixed(1) + "M";
				netstr += " | "
				if(result.servers[i].network_tx < 1024*1024)
					netstr += (result.servers[i].network_tx/1024).toFixed(1) + "K";
				else
					netstr += (result.servers[i].network_tx/1024/1024).toFixed(1) + "M";
				TableRow.children["network"].innerHTML = netstr;

				//Traffic
				var trafficstr = "";
				if(result.servers[i].network_in < 1024*1024*1024*1024)
					trafficstr += (result.servers[i].network_in/1024/1024/1024).toFixed(1) + "G";
                else
                    trafficstr += (result.servers[i].network_in/1024/1024/1024/1024).toFixed(1) + "T";
				trafficstr += " | "
				if(result.servers[i].network_out < 1024*1024*1024*1024)
				    trafficstr += (result.servers[i].network_out/1024/1024/1024).toFixed(1) + "G";
				else
					trafficstr += (result.servers[i].network_out/1024/1024/1024/1024).toFixed(1) + "T";
				TableRow.children["traffic"].innerHTML = trafficstr;

				// CPU
				if (result.servers[i].cpu >= 90)
					TableRow.children["cpu"].children[0].children[0].className = "progress-bar progress-bar-danger";
				else if (result.servers[i].cpu >= 80)
					TableRow.children["cpu"].children[0].children[0].className = "progress-bar progress-bar-warning";
				else
					TableRow.children["cpu"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["cpu"].children[0].children[0].style.width = result.servers[i].cpu + "%";
				TableRow.children["cpu"].children[0].children[0].innerHTML = result.servers[i].cpu + "%";

				// Memory
				var Mem = ((result.servers[i].memory_used/result.servers[i].memory_total)*100.0).toFixed(0);
				if (Mem >= 90)
					TableRow.children["memory"].children[0].children[0].className = "progress-bar progress-bar-danger";
				else if (Mem >= 80)
					TableRow.children["memory"].children[0].children[0].className = "progress-bar progress-bar-warning";
				else
					TableRow.children["memory"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["memory"].children[0].children[0].style.width = Mem + "%";
				TableRow.children["memory"].children[0].children[0].innerHTML = Mem + "%";
				// 节点IP + 最后更新时间
				ExpandRow[0].children["expand_ip"].innerHTML = "IP: " + (result.servers[i].ip || "-") + "　最后更新: " + fmtClock(result.servers[i].last_update);
				// 内存|swap
				ExpandRow[0].children["expand_mem"].innerHTML = "内存|虚存: " + bytesToSize(result.servers[i].memory_used*1024, 1) + " / " + bytesToSize(result.servers[i].memory_total*1024, 1) + " | " + bytesToSize(result.servers[i].swap_used*1024, 0) + " / " + bytesToSize(result.servers[i].swap_total*1024, 0);

				// HDD
				var HDD = ((result.servers[i].hdd_used/result.servers[i].hdd_total)*100.0).toFixed(0);
				if (HDD >= 90)
					TableRow.children["hdd"].children[0].children[0].className = "progress-bar progress-bar-danger";
				else if (HDD >= 80)
					TableRow.children["hdd"].children[0].children[0].className = "progress-bar progress-bar-warning";
				else
					TableRow.children["hdd"].children[0].children[0].className = "progress-bar progress-bar-success";
				TableRow.children["hdd"].children[0].children[0].style.width = HDD + "%";
				TableRow.children["hdd"].children[0].children[0].innerHTML = HDD + "%";
				// IO Speed for HDD.
				// IO， 过小的B字节单位没有意义
				var io = "";
				if(result.servers[i].io_read < 1024*1024)
					io += parseInt(result.servers[i].io_read/1024) + "K";
				else
					io += parseInt(result.servers[i].io_read/1024/1024) + "M";
				io += " / "
				if(result.servers[i].io_write < 1024*1024)
					io += parseInt(result.servers[i].io_write/1024) + "K";
				else
					io += parseInt(result.servers[i].io_write/1024/1024) + "M";
				// Expand for HDD.
				ExpandRow[0].children["expand_hdd"].innerHTML = "硬盘|读写: " + bytesToSize(result.servers[i].hdd_used*1024*1024, 2) + " / " + bytesToSize(result.servers[i].hdd_total*1024*1024, 2) + " | " + io;

                // delay time

				// tcp, udp, process, thread count
				ExpandRow[0].children["expand_tupd"].innerHTML = "TCP/UDP/进/线: " + result.servers[i].tcp_count + " / " + result.servers[i].udp_count + " / " + result.servers[i].process_count+ " / " + result.servers[i].thread_count;

                // ping
                var PING_10010 = result.servers[i].ping_10010.toFixed(0);
                var PING_189 = result.servers[i].ping_189.toFixed(0);
                var PING_10086 = result.servers[i].ping_10086.toFixed(0);

				// ping ms + lost rate
				ExpandRow[0].children["expand_ping"].innerHTML = "CU/CT/CM: " + result.servers[i].time_10010 + "ms ("+result.servers[i].ping_10010.toFixed(0)+"%) / " + result.servers[i].time_189 + "ms ("+result.servers[i].ping_189.toFixed(0)+"%) / " + result.servers[i].time_10086 + "ms ("+result.servers[i].ping_10086.toFixed(0)+"%)"

                if (PING_10010 >= 80 || PING_189 >= 80 || PING_10086 >= 80)
                    TableRow.children["ping"].children[0].children[0].className = "progress-bar progress-bar-danger";
                else if (PING_10010 >= 60 || PING_189 >= 60 || PING_10086 >= 60)	
                	TableRow.children["ping"].children[0].children[0].className = "progress-bar progress-bar-warning";
                else
                    TableRow.children["ping"].children[0].children[0].className = "progress-bar progress-bar-success";
	            TableRow.children["ping"].children[0].children[0].innerHTML = PING_10010 + "-" + PING_189 + "-" + PING_10086 + "";

				// monitor
				MableRow.children["monitor_text"].innerHTML = result.servers[i].custom;
			}
		};

		// 汇总所有在线节点：在线数、当前速率（下行|上行）与总流量（下行|上行）
		var ag_rx = 0, ag_tx = 0, ag_in = 0, ag_out = 0, ag_online = 0;
		for (var k = 0; k < rlen; k++) {
			var svr = result.servers[k];
			if (svr.online4 || svr.online6) {
				ag_online++;
				ag_rx += svr.network_rx || 0;
				ag_tx += svr.network_tx || 0;
				ag_in += svr.network_in || 0;
				ag_out += svr.network_out || 0;
			}
		}
		stats_summary = "　在线数: " + ag_online + "/" + rlen +
			"　当前速率↓|↑: " + fmtRate(ag_rx) + " | " + fmtRate(ag_tx) +
			"　总流量↓|↑: " + fmtTraffic(ag_in) + " | " + fmtTraffic(ag_out);

		d = new Date(result.updated*1000);
		error = 0;
	}).fail(function(update_error) {
		if (!error) {
			$("#servers > tr.accordion-toggle").each(function(i) {
				var TableRow = $("#servers tr#r" + i)[0];
				var MableRow = $("#monitors tr#r" + i)[0];
				var ExpandRow = $("#servers #rt" + i);
				TableRow.children["online_status"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["online_status"].children[0].children[0].innerHTML = "<small>错误</small>";
				MableRow.children["monitor_status"].children[0].children[0].className = "progress-bar progress-bar-error";
				MableRow.children["monitor_status"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["month_traffic"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["month_traffic"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["uptime"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["uptime"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["load"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["load"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["network"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["network"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["traffic"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["traffic"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["cpu"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["cpu"].children[0].children[0].style.width = "100%";
				TableRow.children["cpu"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["memory"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["memory"].children[0].children[0].style.width = "100%";
				TableRow.children["memory"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["hdd"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["hdd"].children[0].children[0].style.width = "100%";
				TableRow.children["hdd"].children[0].children[0].innerHTML = "<small>错误</small>";
				TableRow.children["ping"].children[0].children[0].className = "progress-bar progress-bar-error";
				TableRow.children["ping"].children[0].children[0].style.width = "100%";
				TableRow.children["ping"].children[0].children[0].innerHTML = "<small>错误</small>";
				MableRow.children["monitor_text"].children[0].children[0].className = "progress-bar progress-bar-error";
				MableRow.children["monitor_text"].children[0].children[0].innerHTML = "<small>错误</small>";
				if(ExpandRow.hasClass("in")) {
					ExpandRow.collapse("hide");
				}
				TableRow.setAttribute("data-target", "");
				MableRow.setAttribute("data-target", "");
				server_status[i] = false;
			});
		}
		error = 1;
		$("#updated").html("更新错误.");
	});
}

function updateTime() {
	if (!error)
		$("#updated").html("最后更新: " + timeSince(d) + "　" + stats_summary);
}

uptime();
updateTime();
setInterval(uptime, 2000);
setInterval(updateTime, 2000);


// styleswitcher.js
function setActiveStyleSheet(title, cookie=false) {
        var i, a, main;
        for(i=0; (a = document.getElementsByTagName("link")[i]); i++) {
                if(a.getAttribute("rel").indexOf("style") != -1 && a.getAttribute("title")) {
                        a.disabled = true;
                        if(a.getAttribute("title") == title) a.disabled = false;
                }
        }
        if (true==cookie) {
                createCookie("style", title, 365);
        }
}

function getActiveStyleSheet() {
	var i, a;
	for(i=0; (a = document.getElementsByTagName("link")[i]); i++) {
		if(a.getAttribute("rel").indexOf("style") != -1 && a.getAttribute("title") && !a.disabled)
			return a.getAttribute("title");
	}
	return null;
}

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ')
			c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length,c.length);
	}
	return null;
}

window.onload = function(e) {
        var cookie = readCookie("style");
        if (cookie && cookie != 'null' ) {
                setActiveStyleSheet(cookie);
        } else {
                function handleChange (mediaQueryListEvent) {
                        if (mediaQueryListEvent.matches) {
                                setActiveStyleSheet('dark');
                        } else {
                                setActiveStyleSheet('light');
                        }
                }
                const mediaQueryListDark = window.matchMedia('(prefers-color-scheme: dark)');
                setActiveStyleSheet(mediaQueryListDark.matches ? 'dark' : 'light');
                mediaQueryListDark.addEventListener("change",handleChange);
        }
}
