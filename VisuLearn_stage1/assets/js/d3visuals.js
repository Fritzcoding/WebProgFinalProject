// compare page uses Google Charts loader for convenience and simple synthetic data
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(()=>{
  document.getElementById('gen-data').addEventListener('click', ()=>{
    const data = new google.visualization.DataTable();
    data.addColumn('number','n');
    data.addColumn('number','Bubble (ops)');
    data.addColumn('number','Merge (ops)');
    data.addColumn('number','Quick (ops)');
    const rows=[];
    for(let n=10;n<=200;n+=10){
      rows.push([n, n*n, Math.round(n*Math.log2(n)), Math.round(n*Math.log2(n)*0.9)]);
    }
    data.addRows(rows);
    const options = {title:'Operation counts (synthetic)', hAxis:{title:'Input size'}, vAxis:{title:'Ops'}, legend:{position:'bottom'}};
    const chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
  });
});
