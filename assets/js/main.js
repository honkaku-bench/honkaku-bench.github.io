/* Honkaku Bench — light interactivity.
   Renders the "first eight" comparison table with score bars. */
(function () {
  var EIGHT = [
    { id: "01", title: "The Whirlpool House Affair", fable: 80.0, opus: 45.0 },
    { id: "02", title: "The Geometry Inn",           fable: 100.0, opus: 100.0 },
    { id: "03", title: "The Tale of the Aoandon",    fable: 75.0, opus: 42.5 },
    { id: "04", title: "The Magic Door Murders",     fable: 100.0, opus: 40.0 },
    { id: "05", title: "The Londinium Banquet",      fable: 100.0, opus: 100.0 },
    { id: "06", title: "Nisemono Maniac",            fable: 100.0, opus: 55.0 },
    { id: "07", title: "RPG JUMP",                   fable: 88.9, opus: 5.6 },
    { id: "08", title: "Not (Random) Ball-Drawing",  fable: 26.3, opus: 0.0 }
  ];

  function bar(cls, val) {
    return '<div class="scorebar"><div class="track"><div class="fill ' + cls +
      '" style="width:' + val + '%"></div></div><div class="val">' +
      val.toFixed(0) + '%</div></div>';
  }

  var tbody = document.getElementById("eight-rows");
  if (!tbody) return;
  tbody.innerHTML = EIGHT.map(function (p) {
    return '<tr>' +
      '<td><span class="big-num" style="color:var(--accent)">' + p.id + '</span></td>' +
      '<td><a href="puzzle-' + p.id + '.html">' + p.title + '</a></td>' +
      '<td>' + bar("fable", p.fable) + '</td>' +
      '<td>' + bar("opus", p.opus) + '</td>' +
      '<td><a href="puzzle-' + p.id + '.html" style="font-weight:600">Try it &rarr;</a></td>' +
      '</tr>';
  }).join("");
})();
