import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    toastOptions={{
      classNameFunction: (toast) => {
        switch (toast.type) {
          case "error":
            return "group toast group-[.toaster]:bg-red-600 group-[.toaster]:text-white group-[.toaster]:border-red-600"
          case "success":
            return "group toast group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-600"
          default:
            return "group toast"
        }
      },
    }}
    {...props}
  />
)

export { Toaster }
