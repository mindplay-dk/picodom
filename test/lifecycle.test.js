import { h, patch } from "../src"

beforeEach(() => {
  document.body.innerHTML = ""
})

test("oncreate", done => {
  patch(
    document.body,
    null,
    h(
      "div",
      {
        oncreate(element) {
          element.className = "foo"
          expect(document.body.innerHTML).toBe(`<div class="foo">foo</div>`)
          done()
        }
      },
      "foo"
    )
  )
})

test("onupdate", done => {
  var view = value =>
    h(
      "div",
      {
        class: value,
        onupdate(element, oldProps) {
          expect(element.textContent).toBe("foo")
          expect(oldProps.class).toBe("foo")
          done()
        }
      },
      value
    )

  let node = view("foo")

  patch(document.body, null, node)
  patch(document.body, node, node)
})

test("onremove", done => {
  var view = value =>
    value
      ? h(
          "ul",
          {
            oncreate() {
              expect(document.body.innerHTML).toBe(
                "<ul><li></li><li></li></ul>"
              )
            }
          },
          [
            h("li"),
            h("li", {
              onremove(element) {
                expect(document.body.innerHTML).toBe(
                  "<ul><li></li><li></li></ul>"
                )
                return remove => {
                  remove()
                  expect(document.body.innerHTML).toBe("<ul><li></li></ul>")
                  done()
                }
              }
            })
          ]
        )
      : h("ul", {}, [h("li")])

  let node = view(true)
  patch(document.body, null, node)
  patch(document.body, node, view(false))
})

test("ondestroy", done => {
  var events = []
  var view = value =>
    value
      ? h(
          "p",
          {
            onremove() {
              events.push("removed 1") // never called
            },
            ondestroy() {
              events.push("destroyed 1") // never called
            }
          },
          h(
            "p",
            {
              id: "A",
              onremove() {
                events.push("removed 2") // called first
              },
              ondestroy(element) {
                events.push("destroyed 2: " + element.id) // called third
                throw new Error(element.id)
              }
            },
            h(
              "p",
              {
                id: "B",
                onremove() {
                  events.push("removed 3") // never called
                },
                ondestroy(element) {
                  events.push("destroyed 3: " + element.id) // called second
                }
              })))
      : h("p", {})

  let node = view(true)
  patch(document.body, null, node)
  patch(document.body, node, view(false))
  expect(events).toEqual(["removed 2", "destroyed 3: B", "destroyed 2: A"])
})

test("event bubling", done => {
  var view = value =>
    h(
      "main",
      {
        oncreate() {
          expect(count++).toBe(3)
        },
        onupdate() {
          expect(count++).toBe(7)
          done()
        }
      },
      [
        h("p", {
          oncreate() {
            expect(count++).toBe(2)
          },
          onupdate() {
            expect(count++).toBe(6)
          }
        }),
        h("p", {
          oncreate() {
            expect(count++).toBe(1)
          },
          onupdate() {
            expect(count++).toBe(5)
          }
        }),
        h("p", {
          oncreate() {
            expect(count++).toBe(0)
          },
          onupdate() {
            expect(count++).toBe(4)
          }
        })
      ]
    )

  let count = 0
  let node = view(true)

  patch(document.body, null, node)
  patch(document.body, node, view(false))
})
