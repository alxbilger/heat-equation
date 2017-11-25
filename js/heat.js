
class View
{
    constructor()
    {
        this.ctx = document.getElementById("canvas").getContext('2d');

        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Heat evolution, u(x, t)',
                    backgroundColor: [
                        "rgba(230, 126, 34, 0.2)"
                    ],
                    borderColor: [
                        "rgba(230, 126, 34, 1.0)"
                    ],
                    borderWidth: 1,
                    lineTension: 0.2
                }]
            },
            options: {
                animation: {
                    duration: 0
                },
                maintainAspectRatio: false,
                responsive: true,
                legend: {
                    display: true,
                    labels: {
                        fontColor: 'white'
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true,
                            fontColor: 'white'
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            fontColor: 'white',
                            callback: function(value, index, values) {
                                return Math.floor(100. * value) / 100;
                            }
                        }
                    }]
                }
            }
        });

        this.chartColors = {
        	'backwardEuler': 'rgb(255, 99, 132)',
        	'forwardEuler': 'rgb(255, 159, 64)'
        };
    }

    updateFromSimulation(simulation)
    {
        var nbDigits = 5;
        $("#current_t").text(Math.floor(Math.pow(10, nbDigits) * simulation.current_time) / Math.pow(10, nbDigits));
    }

    updateFromModel(models)
    {
        //get labels for the first chart
        for (var key in models)
        {this.chart.data.labels = models[key].x;break;}

        this.chart.data.datasets = [];
        for (var key in models)
        {
            var dataset = {
                label: 'u(x,t) : ' + key,
                data : models[key].u,
                borderColor: this.chartColors[key]
            };
            this.chart.data.datasets.push(dataset);
        }

        var left   = Number($("#u_left_0").val());
        var right  = Number($("#u_right_0").val());
        var middle = Number($("#u_middle_0").val());
        var left_t   = Number($("#u_left").val());
        var right_t  = Number($("#u_right").val());
        var b = Math.max(left, right, middle, left_t, right_t);
        var a = Math.min(left, right, middle, left_t, right_t);

        view.chart.options.scales.yAxes[0].ticks.max = b;
        view.chart.options.scales.yAxes[0].ticks.min = a;

        //add color gradient if only one dataset
        if (view.chart.data.datasets.length == 1)
        {
            for (var key in models)
            {
                var n = models[key].u.length;
                this.gradient = this.ctx.createLinearGradient(0, 0, $('#canvas').width(), 0);
                for (var i = 0; i < n; ++i)
                {
                    var x = i / (n-1);
                    var t = (models[key].u[i] - a) / (b - a);
                    var alpha = 0.2 + (t) * 0.4;
                    var c = 'rgba(' + Math.floor(t * 255) + ',0,' + Math.floor((1. - t) * 255) + ',' + alpha + ')';
                    this.gradient.addColorStop(x, c);
                }
                view.chart.data.datasets[0].backgroundColor = this.gradient;
            }
        }
    }
}

class Simulation
{
    constructor(dt)
    {
        this.solver = 'backwardEuler';
        this.dt = dt;
        this.reset();
    }

    reset()
    {
        this.current_time = 0;
    }

    forward(view, model)
    {
        this.current_time += this.dt;

        if (this.solver === 'backwardEuler')
            backwardEuler(model);
        else
            forwardEuler(model);
    }
}

class Model
{
    reset(numberOfPoints)
    {
        this.x = [];
        this.u = [];
        for (var i = 0; i < numberOfPoints; ++i)
        {
            this.x[i] = i / (numberOfPoints - 1);
            this.u[i] = 0.0;
        }
    }

    initByCubicInterpolation(left, right, middle)
    {
        for(var i = 0; i < this.u.length; ++i)
        {
            this.u[i] = cubicInterpolation(left, right, middle, this.x[i]);
        }
    }
}

var view;
var simulations = {};
var models = {};
var usedSolvers = {'backwardEuler' : true, 'forwardEuler' : false};

var implicitMatrix = math.matrix('sparse');
var implicitMatrixCoefficient = 0;

//cubic polynomial
function cubic(a, b, c, d, x)
{
    var x2 = x*x;
    return a * x * x2 + b * x2 + c * x + d;
}

//cubic interpolation from the values in 0, 0.5 and 1
//tangent is assumed horizontal in 0.5
function cubicInterpolation(left, right, middle, x)
{
    var g = 0;//tangent

    var d = left;
    var a = -4. * left + 4. * right               - 4. * g;
    var b =  8. * left - 4. * right - 4. * middle + 6. * g;
    var c = -5. * left + 1. * right + 4. * middle - 2. * g;

    return cubic(a,b,c,d,x);
}

function reinit()
{
    //get input values
    var left   = Number($("#u_left_0").val());
    var right  = Number($("#u_right_0").val());
    var middle = Number($("#u_middle_0").val());

    //number of mesh points
    var n = $("#gridSlider").val();

    for (var key in models)
    {
        models[key].reset(n);
        models[key].initByCubicInterpolation(left, right, middle);
    }

    view.updateFromModel(models);

    for (var key in simulations)
    {
        simulations[key].reset();
    }

    implicitMatrix = math.matrix();

    view.chart.update();
}

function computeFourier()
{
    var F = Number($("#alpha").val()) * Number($("#dt").val())  * Math.pow( Number($("#gridSlider").val()) , 2);
    return F;
}

function forwardEuler(model)
{
    //number of mesh points
    var n = model.u.length;
    var F = computeFourier();

    //set boundary conditions
    model.u[0]     = Number($("#u_left").val());
    model.u[n - 1] = Number($("#u_right").val());

    //explicit step
    for (var i = 1; i < n - 1; ++i)
    {
        model.u[i] += F * (model.u[i+1] - 2 * model.u[i] + model.u[i-1]);
    }
}

function backwardEuler(model)
{
    //number of mesh points
    var n = model.u.length;
    var F = computeFourier();

    if (implicitMatrix.size() == 0 || implicitMatrixCoefficient != F)
    {
        implicitMatrixCoefficient = F;
        implicitMatrix = math.zeros(n,n,'sparse');
        for (i = 1; i < n-1; ++i)
        {
            implicitMatrix.subset(math.index(i, i-1), -F);
            implicitMatrix.subset(math.index(i, i+1), -F);
            implicitMatrix.subset(math.index(i, i  ),  1. + 2. * F);
        }
        implicitMatrix.subset(math.index(0, 0)    , 1.);
        implicitMatrix.subset(math.index(n-1, n-1), 1.);
    }

    var b = math.zeros(n);
    for (var i = 1; i < n-1; ++i)
    {
        b.subset(math.index(i), model.u[i]);
    }
    b.subset(math.index(0)  , Number($("#u_left").val()));
    b.subset(math.index(n-1), Number($("#u_right").val()));

    var x = math.lusolve(implicitMatrix, b);
    for (i = 0; i < n; ++i)
    {
        model.u[i] = x.subset(math.index(i,0));
    }
}


$(document).ready(function(){

    view = new View();
    updateFromAvailableSolvers();

    //Set the discretization parameter and compute the initial values
    setDiscretization();

    $("#dt").change(function()
    {
        var dt = Number($("#dt").val());
        for(var key in simulations)
            simulations[key].dt = dt;

        updateFourier();
    });

    $("#alpha").change(function()
    {
        updateFourier();
    });

    //click on the reinit button
    $("#reinit_button").click(function()
    {
        reinit();
    });

    var interval;

    //click on the start button
    $("#start_button").click(function()
    {
        var self = $("#start_button");
        if (self.text().includes("Start"))
        {
            self.html("<i class=\"fa fa-pause\" aria-hidden=\"true\"></i> Pause");

            interval = setInterval(function()
            {
                for(var key in simulations)
                    if (usedSolvers[key])
                        simulations[key].forward(view, models[key]);
                view.updateFromModel(models);
                for(var key in simulations)
                    {view.updateFromSimulation(simulations[key]);break;}
                view.chart.update();
            }, 1000./24.);
        }
        else {
            self.html("<i class=\"fa fa-play\" aria-hidden=\"true\"></i> Start");
            clearInterval(interval);
        }
    });

    //click on the step button
    $("#step_button").click(function()
    {
        for(var key in simulations)
            if (usedSolvers[key])
                simulations[key].forward(view, models[key]);
        view.updateFromModel(models);
        for(var key in simulations)
            {view.updateFromSimulation(simulations[key]);break;}
        view.chart.update();
    });

    function updateFourier()
    {
        var nbDigits = 5;
        var F = computeFourier();
        F = Math.floor(Math.pow(10, nbDigits) * F) / Math.pow(10, nbDigits)
        if (F > 0.5){
            $("#fourierNumber").html(F + " <span class=\"warning\"><i class=\"fa fa-exclamation-triangle\" aria-hidden=\"true\"></i>" + " Forward Euler unstable<span>");
        } else {
            $("#fourierNumber").text(F);
        }

    }

    //action when moving the discretization slider
    function setDiscretization()
    {
        var d = $("#gridSlider").val();
        $("#gridSliderValue").text(d);

        for (var key in simulations)
            if (usedSolvers[key])
                if (simulations[key].current_time === 0)
                    {reinit(); break;}

        updateFourier();
    }

    //moving slider
    $("#gridSlider").on('input', function(){
        setDiscretization();
    });

    function updateFromAvailableSolvers()
    {
        var left   = Number($("#u_left_0").val());
        var right  = Number($("#u_right_0").val());
        var middle = Number($("#u_middle_0").val());

        if (usedSolvers['backwardEuler'])
        {
            $("#solverBackward").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>Backward Euler");
            if (!('backwardEuler' in simulations))
                simulations['backwardEuler'] = new Simulation(Number($("#dt").val()));
            simulations['backwardEuler'].solver = 'backwardEuler';
            if (!('backwardEuler' in models))
            {
                models['backwardEuler'] = new Model();
                models['backwardEuler'].reset( $("#gridSlider").val());
                models['backwardEuler'].initByCubicInterpolation(left, right, middle);
                view.updateFromModel(models);
                view.chart.update();
            }
        }
        else
        {
            $("#solverBackward").html("Backward Euler");

            delete simulations['backwardEuler'];
            delete models['backwardEuler'];
        }
        if (usedSolvers['forwardEuler'])
        {
            $("#solverForward").html("<i class=\"fa fa-check\" aria-hidden=\"true\"></i>Forward Euler");
            if (!('forwardEuler' in simulations))
                simulations['forwardEuler'] = new Simulation(Number($("#dt").val()));
            simulations['forwardEuler'].solver = 'forwardEuler';
            if (!('forwardEuler' in models))
            {
                models['forwardEuler'] = new Model();
                models['forwardEuler'].reset( $("#gridSlider").val());
                models['forwardEuler'].initByCubicInterpolation(left, right, middle);
                view.updateFromModel(models);
                view.chart.update();
            }
        }
        else
        {
            $("#solverForward").html("Forward Euler");

            delete simulations['forwardEuler'];
            delete models['forwardEuler'];
        }

        view.updateFromModel(models);
        view.chart.update();
    }

    $("#solverBackward").click(function()
    {
        usedSolvers['backwardEuler'] = !usedSolvers['backwardEuler'];
        updateFromAvailableSolvers();
    });
    $("#solverForward").click(function()
    {
        usedSolvers['forwardEuler'] = !usedSolvers['forwardEuler'];
        updateFromAvailableSolvers();
    });
});
