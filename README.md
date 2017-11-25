# heat-equation
Javascript solver for 1D diffusion equation. The solution is directly visualized in the browser. Test it on https://alxbilger.github.io/heat-equation/

## Diffusion Equation
![equation](http://www.sciweavers.org/tex2img.php?eq=%5Cfrac%7B%5Cpartial%20u%7D%7B%5Cpartial%20t%7D%20%3D%20%5Calpha%20%5Cfrac%7B%5Cpartial%5E2%20u%7D%7B%5Cpartial%20x%5E2%7D&bc=White&fc=Black&im=jpg&fs=24&ff=modern&edit=0)
u is the unknown function to be solved, and is a function of x, a spatial coordinate, and t the time. The coefficient alpha is the diffusion coefficient.

## Solvers
The diffusion equation is solved in 1D. Two solvers are available:

* Forward Euler
* Backward Euler

## Initialization

The initial temperature function is defined from the temperature on the left, the temperature on the right, and the temperature on the middle.

## Boundary conditions

The temperature on both extremities can be parameterized.
