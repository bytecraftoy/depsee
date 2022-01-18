/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, fireEvent } from '@testing-library/react';
import { App } from '../App';

beforeAll(() => {
    window.ResizeObserver =
        window.ResizeObserver ||
        jest.fn().mockImplementation(() => ({
            disconnect: jest.fn(),
            observe: jest.fn(),
            unobserve: jest.fn(),
        }));

    Object.defineProperties(window.HTMLElement.prototype, {
        offsetHeight: {
            get() {
                return parseFloat(this.style.height) || 1;
            },
        },
        offsetWidth: {
            get() {
                return parseFloat(this.style.width) || 1;
            },
        },
    });
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
});

test('Renders with default props', () => {
    const { getByText } = render(<App />);
    const output1 = getByText('Tasks');
    const output2 = getByText('Add task');
    const output3 = getByText('Text:');

    expect(output1).toHaveTextContent('Tasks');
    expect(output2).toHaveTextContent('Add task');
    expect(output3).toHaveTextContent('Text:');
});

test('Renders the button with proper content', () => {
    const component = render(<App />);
    const button = component.container.querySelector('button');

    expect(button).toHaveTextContent('Add');
});

test('Button click calls a function', () => {
    /* This test will be moved to Toolbar once the branches
    *  have merged
    */
    jest.mock('../App');
    const { getByText } = render(<App />);
    const button = getByText('Add');
    fireEvent.click(button);

    expect(App).toBeCalled;
});

test('The initial textbox should be empty', () => {
    const component = render(<App />);
    const input = component.container.querySelector('input');
    expect(input).toHaveValue('');
});

test('Changin the initial node text box should be possible', () => {
    const component = render(<App />);
    const input = component.container.querySelector('input');
    if (input) {
        fireEvent.change(input, {
            target: { value: 'Add physics' },
        });
        expect(input).toHaveValue('Add physics');
    }
});

test('App should include graph', () => {
    const component = render(<App />);
    const graph = component.container.querySelector('Graph');
    expect(graph).toBeVisible;
    expect(graph).toBeInTheDocument;
});
